from fastapi import APIRouter
import yfinance as yf
import pandas as pd
from data.user_selection import selected_stocks
import statsmodels.api as sm
from fastapi import APIRouter, HTTPException
import traceback
import numpy as np
from statsmodels.tsa.arima.model import ARIMA

router = APIRouter()

@router.get("/api/market-movers")
def get_market_movers():
    print("===== MARKET PY TERLOAD =====")

    market_stocks = [
        "BBCA.JK","BBRI.JK","BMRI.JK","BBNI.JK",
        "TLKM.JK","ASII.JK","UNTR.JK","ICBP.JK",
        "INDF.JK","MYOR.JK","KLBF.JK","SIDO.JK",
        "CPIN.JK","JPFA.JK","ANTM.JK","PTBA.JK",
        "ADRO.JK","ITMG.JK","HRUM.JK","MEDC.JK",
        "PGAS.JK","AKRA.JK","SMGR.JK","INTP.JK",
        "TPIA.JK","BRPT.JK","ESSA.JK","JSMR.JK",
        "AMMN.JK","MDKA.JK","BRIS.JK","MAPI.JK",
        "GOTO.JK","ACES.JK","ERAA.JK","HEAL.JK",
        "MIKA.JK","SILO.JK","CTRA.JK","BSDE.JK",
        "PWON.JK","AUTO.JK","SCMA.JK","BMTR.JK",
        "WIKA.JK","PTPP.JK","PGEO.JK","MAPA.JK",
        "BTPS.JK","ARTO.JK",

        "BFIN.JK","BJTM.JK","BJBR.JK","PNBN.JK",
        "BNGA.JK","MEGA.JK","NISP.JK","DMAS.JK",
        "RALS.JK","LPPF.JK","AMRT.JK","MIDI.JK",
        "MAIN.JK","DSNG.JK","LSIP.JK","AALI.JK",
        "TBIG.JK","MTEL.JK","SSIA.JK","INDY.JK",
        "DOID.JK","ELSA.JK","BBYB.JK","BBTN.JK",
        "TOWR.JK","TBLA.JK","ULTJ.JK","CEKA.JK",
        "ROTI.JK","WOOD.JK","PANI.JK","BIRD.JK",
        "ASSA.JK","SRTG.JK","ADHI.JK","PTRO.JK",
        "MBMA.JK","NICL.JK","CUAN.JK","BREN.JK",

        "ABMM.JK","ACES.JK","AGII.JK","AMAR.JK",
        "ARTO.JK","BBKP.JK","BDMN.JK","BMHS.JK"
    ]

    result = []

    for stock in market_stocks:

        try:

            data = yf.download(
                stock,
                period="5d",
                progress=False,
                auto_adjust=True
            )
            print("STOCK =", stock)
            print(data.head())
            print(data.tail())

            if len(data) < 2:
                continue

            close_price = data["Close"].squeeze()

            last_price = float(
                close_price.iloc[-1]
            )

            prev_price = float(
                close_price.iloc[-2]
            )

            change = round(
                (
                    (last_price - prev_price)
                    / prev_price
                ) * 100,
                2
            )

            print(
                stock,
                "PREV =",
                prev_price,
                "LAST =",
                last_price,
                "CHANGE =",
                change
            )

            result.append({
                "stock": stock,
                "price": round(last_price, 0),
                "change": change
            })

            print("BERHASIL:", stock)

        except Exception as e:
            print("DOWNLOAD ERROR:", e)

    result = sorted(
        result,
        key=lambda x: x["change"],
        reverse=True
    )

    print("RESULT =", result)

    def format_card(item):

        code = item["stock"].replace(".JK", "")

        return {
            "code": code,
            "name": f"Saham {code}",
            "price": f"Rp {int(item['price']):,}".replace(",", "."),
            "change": (
                f"+{item['change']}%"
                if item["change"] > 0
                else f"{item['change']}%"
            )
        }

    top_gainers = [
        format_card(x)
        for x in result
        if x["change"] > 0
    ][:3]

    top_losers = [
        format_card(x)
        for x in sorted(
            result,
            key=lambda x: x["change"]
        )
        if x["change"] < 0
    ][:3]

    monthly_dict = {}

    arima_stocks = (
        selected_stocks
        if len(selected_stocks) > 0
        else ["BBCA.JK","BBRI.JK","TLKM.JK"]
    )

    for stock in arima_stocks:

        try:

            hist = yf.download(
                stock,
                period="2y",
                progress=False,
                auto_adjust=True
            )

            print("HIST =", stock)
            print(hist.head())

            if hist.empty:
                continue

            monthly = (
                hist["Close"]
                .squeeze()
                .resample("ME")
                .mean()
            )

            print("MONTHLY LENGTH =", len(monthly))
            print(monthly.tail())

            monthly = monthly.dropna()

            if len(monthly) > 12:

                model = ARIMA(
                    monthly,
                    order=(2,1,2)
                )

                fitted = model.fit()

                forecast = fitted.forecast(steps=6)

                for i, value in enumerate(forecast):

                    next_month = (
                        monthly.index[-1]
                        + pd.DateOffset(months=i+1)
                    )

                    monthly.loc[next_month] = value
                
                print(stock)
                print(monthly.tail())
                print(type(monthly))

            monthly_dict[
                stock.replace(".JK", "")
            ] = monthly

            print("MASUK =", stock)
            print(monthly.tail())

        except Exception as e:
            print("DOWNLOAD ERROR:", stock)
            print(e)

    trend_data = []

    if len(monthly_dict) > 0:

        combined = pd.DataFrame(monthly_dict)
        combined = combined.dropna(how="all")

        combined.index = combined.index.strftime("%Y-%m")

        for month, row in combined.iterrows():

            item = {
                "month": month
            }

            for col in combined.columns:

                item[col] = (
                    round(float(row[col]), 2)
                    if pd.notna(row[col])
                    else None
                )

            trend_data.append(item)
            print("MONTHLY_DICT =", monthly_dict.keys())
            print("TOP GAINERS =", top_gainers)
            print("TOP LOSERS =", top_losers)
            print("TREND DATA =", trend_data[:2] if trend_data else [])
                        
    return {
        "topGainers": top_gainers,
        "topLosers": top_losers,
        "trendData": trend_data
    }