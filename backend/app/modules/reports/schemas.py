from pydantic import BaseModel
from datetime import datetime

class DashboardStats(BaseModel):
    today_sales: float
    active_debts: float
    monthly_sales: float
    low_stock_items: int

class DailySalesReport(BaseModel):
    date: datetime
    total_sales: float
    total_cash: float
    total_card: float
    transaction_count: int
