from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
#from psycopg2.extras import RealDictCursor
import numpy as np
import pandas as pd
from scipy.optimize import minimize
#from database import get_db_connection
import yfinance as yf
from data.user_selection import selected_stocks

# Gunakan router, bukan app
router = APIRouter()

class PortfolioRequest(BaseModel):
    stocks: str
    budget: float
    period: str = "2y"

@router.post("/api/simulate")
def simulate_portfolio(request: PortfolioRequest):

    raw_stocks = [
        s.strip().upper()
        for s in request.stocks.split(',')
        if s.strip()
    ]

    valid_stocks = [
        s if s.endswith('.JK')
        else f"{s}.JK"
        for s in raw_stocks
    ]
    selected_stocks.clear()
    selected_stocks.extend(valid_stocks)

    print("VALID STOCKS =", valid_stocks)
    print("SELECTED =", selected_stocks)

    print("USER PILIH:", selected_stocks)
    try:

        # Ambil data historis langsung dari Yahoo Finance
        price_data = yf.download(
            valid_stocks,
            period=request.period,
            auto_adjust=True,
            progress=False
        )

        if price_data.empty:
            raise HTTPException(
                status_code=404,
                detail="Data saham tidak ditemukan"
            )

        # Ambil harga penutupan
        if len(valid_stocks) == 1:
            close_prices = price_data[['Close']]
            close_prices.columns = valid_stocks
        else:
            close_prices = price_data['Close']

        # Hitung return harian (%)
        df_pivot = np.log(
            close_prices /
            close_prices.shift(1)
        ).dropna()

        mean_returns = df_pivot.mean().values
        cov_matrix = df_pivot.cov().values
        num_assets = len(mean_returns)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal mengambil data Yahoo Finance: {str(e)}"
        )

    def negative_sharpe(weights, mean_returns, cov_matrix, risk_free_rate=0.0):
        p_ret = np.sum(mean_returns * weights)
        p_std = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))

        if p_std == 0:
            return 999999

        return -(p_ret - risk_free_rate) / p_std

    constraints = (
        {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
    )

    bounds = tuple(
        (0, 1)
        for _ in range(num_assets)
    )

    optimized = minimize(
        negative_sharpe,
        num_assets * [1.0 / num_assets],
        args=(mean_returns, cov_matrix),
        method='SLSQP',
        bounds=bounds,
        constraints=constraints
    )

    optimal_weights = optimized.x

    portfolio_daily_returns = np.dot(
        df_pivot.values,
        optimal_weights
    )

    expected_return_pct = round(
        portfolio_daily_returns.mean() * 100,
        2
    )

    np.random.seed(42)

    simulated_portfolio_returns = np.dot(
        np.random.multivariate_normal(
            mean_returns,
            cov_matrix,
            10000
        ),
        optimal_weights
    )

    var_95_percent = np.percentile(
        simulated_portfolio_returns,
        5
    )

    chart_data = []
    action_plan = []

    stock_names = df_pivot.columns.tolist()

    for i in range(num_assets):

        weight_percent = round(
            optimal_weights[i] * 100,
            1
        )

        stock_code = stock_names[i].replace('.JK', '')

        ind_return = round(
            ((np.exp(mean_returns[i] * 22) - 1) * 100),
            2
        )
        ind_var_pct = abs(
            round(
                np.percentile(
                    df_pivot[stock_names[i]].dropna(),
                    5
                )*100,
                2
            )
        )

        ind_risk = (
            "Low"
            if ind_var_pct < 2
            else "Moderate"
            if ind_var_pct < 5
            else "High"
        )

        if weight_percent > 0:
            chart_data.append({
                "name": stock_code,
                "value": weight_percent
            })

        if weight_percent > 40:
            action_plan.append({
                "stock": stock_code,
                "status": "Fokus Utama",
                "color": "green",
                "desc": f"Alokasikan porsi besar ({weight_percent}%).",
                "indReturn": ind_return,
                "indVar": ind_var_pct,
                "indRisk": ind_risk
            })

        elif weight_percent > 0:
            action_plan.append({
                "stock": stock_code,
                "status": "Pelengkap",
                "color": "yellow",
                "desc": f"Beli secukupnya ({weight_percent}%).",
                "indReturn": ind_return,
                "indVar": ind_var_pct,
                "indRisk": ind_risk
            })

        else:
            action_plan.append({
                "stock": stock_code,
                "status": "Hindari / Jual",
                "color": "red",
                "desc": "AI merekomendasikan 0%.",
                "indReturn": ind_return,
                "indVar": ind_var_pct,
                "indRisk": ind_risk
            })

    var_percentage_abs = abs(
        round(var_95_percent*100, 2)
    )

    portfolio_return = np.sum(
        mean_returns * optimal_weights
    )

    print("================================")
    print("MEAN RETURNS =", mean_returns)
    print("WEIGHTS =", optimal_weights)
    print("PORTFOLIO RETURN =", portfolio_return)
    print("================================")

    return {
        "chartData": chart_data,
        "actionPlan": action_plan,
        "metrics": {
            "expectedReturn": round(
                (
                    np.exp(
                        np.sum(mean_returns * optimal_weights) * 252
                    ) - 1
                ) * 100,
                2
            ),
            "varValue": round(
                request.budget *
                (var_percentage_abs / 100),
                0
            ),
            "varPercentage": var_percentage_abs,
            "riskLevel": (
                "Low"
                if var_percentage_abs < 2
                else "Moderate"
                if var_percentage_abs < 5
                else "High"
            )
        }
    }