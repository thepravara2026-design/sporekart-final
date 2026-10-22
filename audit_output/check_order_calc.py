import pg8000.native, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
con = pg8000.native.Connection(user='postgres.irwiiyowpppdynbmwwuz', password='MyDbSporekart@123#', host='aws-0-ap-northeast-1.pooler.supabase.com', port=6543, database='postgres', ssl_context=ctx)
rows = con.run("SELECT sku, quantity, price_inr, gst_rate_percent, gst_amount_inr, line_total_inr FROM order_items WHERE order_id = '81fed250-6ccf-4e98-b32a-d8f3486871bc';")
print("Order items for 81fed250-6ccf-4e98-b32a-d8f3486871bc:")
for r in rows:
    print(r)
ord_row = con.run("SELECT subtotal_amount_inr, gst_total_amount_inr, total_amount_inr FROM orders WHERE id = '81fed250-6ccf-4e98-b32a-d8f3486871bc';")
print("Order row:", ord_row)
con.close()
