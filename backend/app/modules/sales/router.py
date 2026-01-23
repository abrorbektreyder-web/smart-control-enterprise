from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.notifications import send_telegram_alert
from app.modules.sales.models import Sale, SaleItem, VoidItem, PaymentMethod
from app.modules.sales.schemas import SaleCreate, SaleResponse, VoidCreate, VoidResponse
from app.modules.products.models import Product
from app.modules.debts.models import Debt, DebtStatus # Import Debt models

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.post("/checkout", response_model=SaleResponse)
def create_sale(sale_data: SaleCreate, user_id: int, db: Session = Depends(get_db)):
    # 1. Validation for Debt
    if sale_data.payment_method == PaymentMethod.DEBT:
        if not sale_data.customer_name or not sale_data.customer_phone:
            raise HTTPException(status_code=400, detail="Customer Name and Phone are required for Debt sales")

    # 2. Calculate Total & Create Sale
    total_amount = 0
    new_sale = Sale(
        user_id=user_id,
        shift_id=sale_data.shift_id,
        payment_method=sale_data.payment_method,
        total_amount=0
    )
    db.add(new_sale)
    db.flush()

    for item in sale_data.items:
        product = db.query(Product).filter(Product.barcode == item.barcode, Product.status == "active").first()
        if not product: raise HTTPException(status_code=404, detail=f"Product {item.barcode} not found")
        if product.stock_quantity < item.quantity: raise HTTPException(status_code=400, detail=f"Not enough stock: {product.name}")

        item_total = product.price * item.quantity
        total_amount += float(item_total)
        product.stock_quantity -= item.quantity
        
        db_item = SaleItem(sale_id=new_sale.id, product_id=product.id, quantity=item.quantity, unit_price=product.price, total_price=item_total)
        db.add(db_item)

    new_sale.total_amount = total_amount
    
    # 3. AUTOMATIC DEBT CREATION
    if sale_data.payment_method == PaymentMethod.DEBT:
        # Check if customer already has a debt record (Optional: merge debts? For now, create new record linked to sale)
        new_debt = Debt(
            customer_name=sale_data.customer_name,
            phone_number=sale_data.customer_phone,
            original_amount=total_amount,
            remaining_amount=total_amount,
            sale_id=new_sale.id,
            status=DebtStatus.OPEN
        )
        db.add(new_debt)
        
        # SEND ALERT
        send_telegram_alert(f"📝 NEW DEBT! Customer: {sale_data.customer_name} ({sale_data.customer_phone}). Amount: {total_amount}")

    db.commit()
    db.refresh(new_sale)
    return new_sale

@router.post("/void", response_model=VoidResponse)
def void_item(void_data: VoidCreate, user_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.barcode == void_data.barcode).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_void = VoidItem(
        user_id=user_id,
        product_id=product.id,
        quantity=void_data.quantity,
        reason=void_data.reason,
        status="YELLOW_BASKET"
    )
    db.add(new_void)
    db.commit()
    db.refresh(new_void)
    
    send_telegram_alert(f"⚠️ VOID ALERT! User:{user_id} cancelled {product.name} (x{void_data.quantity}). Reason: {void_data.reason}")
    return new_void
