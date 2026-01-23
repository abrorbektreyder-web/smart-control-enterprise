from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.modules.auth.router import router as auth_router
from app.modules.products.router import router as products_router
from app.modules.shifts.router import router as shifts_router
from app.modules.sales.router import router as sales_router
from app.modules.debts.router import router as debts_router
from app.modules.expenses.router import router as expenses_router
from app.modules.reports.router import router as reports_router

app = FastAPI(
    title="Smart Control POS",
    version="4.0",
    description="Anti-Fraud Local-First POS System"
)

# Mount Static Files for Frontend
frontend_path = Path(__file__).parent.parent.parent / "frontend"
app.mount("/assets", StaticFiles(directory=str(frontend_path / "assets")), name="assets")

# CORS Middleware
origins = ["*"] # Allow all for local dev, restrict in production

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(shifts_router)
app.include_router(sales_router)
app.include_router(debts_router)
app.include_router(expenses_router)
app.include_router(reports_router)

@app.get("/")
def root():
    from fastapi.responses import FileResponse
    return FileResponse(str(frontend_path / "index.html"))
