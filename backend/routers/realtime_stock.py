from fastapi import APIRouter, HTTPException
import yfinance as yf

router = APIRouter()

@router.get("/api/realtime-stock/{ticker}")
def get_stock(ticker: str):

    symbol = f"{ticker.upper()}.JK"

    try:

        stock = yf.Ticker(symbol)

        hist = stock.history(period="1d")

        if hist.empty:
            raise HTTPException(
                status_code=404,
                detail="Ticker tidak ditemukan"
            )

        latest = hist.iloc[-1]

        return {
            "ticker": ticker.upper(),
            "open": float(latest["Open"]),
            "high": float(latest["High"]),
            "low": float(latest["Low"]),
            "close": float(latest["Close"]),
            "volume": int(latest["Volume"])
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ENDPOINT BARU

@router.get("/api/live-prices")
def get_live_prices():
    print("LIVE PRICE REQUEST")

    stocks = [
        "BBCA.JK",
        "BBRI.JK",
        "BMRI.JK",
        "TLKM.JK",
        "ASII.JK",
        "ANTM.JK",
        "BRPT.JK",
        "PGAS.JK",
        "ADRO.JK",
        "INDF.JK",
        "ICBP.JK",
        "UNTR.JK",
        "CPIN.JK",
        "EXCL.JK",
        "MDKA.JK",
        "AMMN.JK",
        "GOTO.JK",
        "KLBF.JK",
        "AKRA.JK",
        "MEDC.JK"
    ]

    result = []

    for stock in stocks:

        try:

            hist = yf.download(
                stock,
                period="5d",
                progress=False,
                auto_adjust=True
            )

            if hist.empty:
                continue

            close_price = (
                hist["Close"]
                .squeeze()
            )

            sparkline = [
                round(float(x), 2)
                for x in close_price.tolist()
            ]

            if len(close_price) < 2:
                continue

            last_price = float(
                close_price.iloc[-1]
            )

            prev_price = float(
                close_price.iloc[-2]
            )

            change = round(
                (
                    last_price / prev_price - 1
                ) * 100,
                2
            )

            print(stock, last_price, change)

            result.append({
                "stock": stock.replace(".JK", ""),
                "price": round(last_price, 0),
                "change": change,
                "history": sparkline
            })

        except Exception as e:

            print("ERROR =", stock)
            print(e)

    return result