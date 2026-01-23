import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, date
from app.core.db import get_db
from app.modules.sales.models import Sale, PaymentMethod
from app.modules.shifts.models import Shift
from app.modules.debts.models import Debt, DebtStatus
from app.modules.products.models import Product
from app.modules.reports.schemas import DashboardStats, DailySalesReport

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = datetime.now().date()
    start_of_today = datetime.combine(today, datetime.min.time())
    
    today_sales = db.query(func.sum(Sale.total_amount)).filter(Sale.created_at >= start_of_today).scalar() or 0
    active_debts = db.query(func.sum(Debt.remaining_amount)).filter(Debt.status != DebtStatus.PAID).scalar() or 0
    last_30_days = datetime.now() - timedelta(days=30)
    monthly_sales = db.query(func.sum(Sale.total_amount)).filter(Sale.created_at >= last_30_days).scalar() or 0
    low_stock = db.query(Product).filter(Product.stock_quantity < 5, Product.status == "active").count()
    
    return DashboardStats(
        today_sales=today_sales,
        active_debts=active_debts,
        monthly_sales=monthly_sales,
        low_stock_items=low_stock
    )

@router.get("/daily-sales", response_model=DailySalesReport)
def get_daily_sales(target_date: date = datetime.now().date(), db: Session = Depends(get_db)):
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = datetime.combine(target_date, datetime.max.time())
    
    sales_query = db.query(Sale).filter(Sale.created_at >= start_of_day, Sale.created_at <= end_of_day)
    
    total_sales = sales_query.with_entities(func.sum(Sale.total_amount)).scalar() or 0
    total_cash = sales_query.filter(Sale.payment_method == PaymentMethod.CASH).with_entities(func.sum(Sale.total_amount)).scalar() or 0
    total_card = sales_query.filter(Sale.payment_method == PaymentMethod.CARD).with_entities(func.sum(Sale.total_amount)).scalar() or 0
    count = sales_query.count()
    
    return DailySalesReport(
        date=start_of_day,
        total_sales=total_sales,
        total_cash=total_cash,
        total_card=total_card,
        transaction_count=count
    )

# NEW EXPORT ENDPOINT FOR ACCOUNTANT
@router.get("/export/tax")
def export_tax_report(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db)
):
    # 1. Fetch Sales Data grouped by Date
    # Format: Date | Total Sales | Cash | Card
    results = db.query(
        func.date(Sale.created_at).label("sale_date"),
        func.sum(Sale.total_amount).label("total"),
        func.sum(
            func.case((Sale.payment_method == PaymentMethod.CASH, Sale.total_amount), else_=0)
        ).label("cash"),
        func.sum(
            func.case((Sale.payment_method == PaymentMethod.CARD, Sale.total_amount), else_=0)
        ).label("card")
    ).filter(
        func.date(Sale.created_at) >= start_date,
        func.date(Sale.created_at) <= end_date
    ).group_by(func.date(Sale.created_at)).order_by(func.date(Sale.created_at)).all()

    # 2. Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header specifically for Tax Reports
    writer.writerow(["SANAY (Date)", "JAMI SAVDO (Total)", "NAQD (Cash)", "PLASTIK (Card)"])
    
    for row in results:
        writer.writerow([row.sale_date, row.total, row.cash, row.card])
        
    output.seek(0)
    
    # 3. Return as a file download
    filename = f"tax_report_{start_date}_{end_date}.csv"
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
