import urllib.request
import json
from run_payment_and_refund_suite import PaymentAndRefundTestSuite

suite = PaymentAndRefundTestSuite()
suite.setup_identities()
var_id, addr_id = suite.setup_catalog_and_address()

# 1. Test verify response format
suite.request("POST", "/cart/items", {"variantId": var_id, "quantity": 1}, token=suite.tokens["CUSTOMER"])
st_o, b_o, _ = suite.request("POST", "/orders", {"addressId": addr_id}, token=suite.tokens["CUSTOMER"])
if st_o != 200:
    print("CREATE ORDER FAILED:", st_o, b_o)
order_id = b_o["data"]["id"]
st_p, b_p, _ = suite.request("POST", "/payment/initiate", {"orderId": order_id}, token=suite.tokens["CUSTOMER"])
rzp_order_id = b_p["data"]["razorpayOrderId"]

st_v, b_v, _ = suite.request("POST", "/payment/verify", {
    "orderId": order_id,
    "razorpayOrderId": rzp_order_id,
    "razorpayPaymentId": "pay_test_keys",
    "razorpaySignature": "mock_sig"
}, token=suite.tokens["CUSTOMER"])

print("VERIFY RESPONSE JSON:", json.dumps(b_v, indent=2))

# 2. Test wallet checkout pay response format
suite.request("POST", "/cart/items", {"variantId": var_id, "quantity": 1}, token=suite.tokens["CUSTOMER"])
st_o2, b_o2, _ = suite.request("POST", "/orders", {"addressId": addr_id}, token=suite.tokens["CUSTOMER"])
order2_id = b_o2["data"]["id"]
st_w, b_w, _ = suite.request("POST", "/wallet/checkout-pay", {
    "orderId": order2_id,
    "type": "ORDER",
    "amountFromWallet": 10.0,
    "amountFromGateway": 0.0
}, token=suite.tokens["CUSTOMER"])
print("WALLET CHECKOUT PAY JSON:", json.dumps(b_w, indent=2))

# 3. Test admin overview format
st_ov, b_ov, _ = suite.request("GET", "/admin/finance/overview", token=suite.tokens["ADMIN"])
print("ADMIN OVERVIEW JSON:", json.dumps(b_ov, indent=2))

# 4. Check why course/batch enrollment failed
st_c, b_c, _ = suite.request("GET", "/training/courses")
print("COURSES LIST:", st_c, b_c)
