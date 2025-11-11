const express = require('express');
const { stringify } = require('csv-stringify/sync');
const nodemailer = require('nodemailer');
const router = express.Router();

const { findOrderById, findSupplierById, upsertSupplierOrder, createAuditLog } = require('../db/helpers');
const { ensureAdmin } = require('../middleware/auth');

function buildSupplierRows(order, supplier) {
  const rows = [];
  for (const item of order.items) {
    rows.push({
      order_id: order.id,
      customer_name: order.shipping?.name || '',
      customer_phone: order.shipping?.phone || '',
      address_line1: order.shipping?.line1 || '',
      address_line2: order.shipping?.line2 || '',
      city: order.shipping?.city || '',
      state: order.shipping?.state || '',
      pincode: order.shipping?.pincode || '',
      sku: item.supplier_sku || item.sku || '',
      qty: item.qty,
      unit_price: item.supplier_price || item.unit_price || 0,
      shipping_cost: item.supplier_shipping_cost || supplier.default_shipping_cost || 0,
      total_amount: ((item.supplier_price || item.unit_price || 0) * item.qty) + (item.supplier_shipping_cost || 0),
      notes: order.notes || '',
    });
  }
  return rows;
}

function generateMailBody(order, supplier, supplierRows) {
  const lines = [];
  lines.push(`Hello ${supplier.contact_name || supplier.name},`);
  lines.push('');
  lines.push(`Please find below our order (internal order id: ${order.id}).`);
  lines.push('');
  lines.push('Shipping details:');
  lines.push(`${order.shipping?.name || ''}`);
  lines.push(`${order.shipping?.line1 || ''}`);
  if (order.shipping?.line2) lines.push(`${order.shipping.line2}`);
  lines.push(`${order.shipping?.city || ''}, ${order.shipping?.state || ''} - ${order.shipping?.pincode || ''}`);
  lines.push(`Phone: ${order.shipping?.phone || ''}`);
  lines.push('');
  lines.push('Order items:');
  for (const r of supplierRows) {
    lines.push(`- SKU: ${r.sku}, Qty: ${r.qty}, Unit Price: ${r.unit_price}`);
  }
  lines.push('');
  lines.push(`Notes: ${order.notes || 'Please pack without supplier invoice if possible.'}`);
  lines.push('');
  lines.push('Please confirm by replying with supplier_order_ref / tracking once placed.');
  lines.push('');
  lines.push('Regards,');
  lines.push('Your Store Ops');
  return lines.join('\n');
}

router.post('/orders/:orderId/generate-supplier-csv', ensureAdmin, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.id) return res.status(403).json({ error: 'Forbidden' });

    const { orderId } = req.params;
    const { supplierId, sendEmail } = req.body;

    const order = await findOrderById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const supplier = await findSupplierById(supplierId);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    const supplierRows = buildSupplierRows(order, supplier);
    const client_generated_id = `supplier-${supplierId}-order-${orderId}-${Date.now()}`;

    const supplierOrderRecord = {
      supplier_id: supplierId,
      internal_order_id: orderId,
      client_generated_id,
      status: 'GENERATED',
      cost_snapshot_json: JSON.stringify({ items: supplierRows, total: supplierRows.reduce((s,r)=>s + parseFloat(r.total_amount),0) }),
      created_by: user.id,
    };
    const saved = await upsertSupplierOrder(supplierOrderRecord);

    const csv = stringify(supplierRows, { header: true });

    if (sendEmail && process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'ops@yourstore.com',
        to: supplier.contact_email,
        subject: `New order ${order.id} — Please fulfill`,
        text: generateMailBody(order, supplier, supplierRows),
        attachments: [{ filename: `order-${order.id}-supplier-${supplierId}.csv`, content: csv }],
      });
    }

    const mailBody = generateMailBody(order, supplier, supplierRows);
    const mailto = `mailto:${encodeURIComponent(supplier.contact_email || '')}?subject=${encodeURIComponent(`New order ${order.id}`)}&body=${encodeURIComponent(mailBody)}`;

    await createAuditLog({ actor_id: user.id, action: 'GENERATE_SUPPLIER_CSV', payload: { orderId, supplierId, supplierOrderId: saved.id } });

    res.json({ success: true, supplierOrderId: saved.id, csv: Buffer.from(csv).toString('base64'), filename: `order-${order.id}-supplier-${supplierId}.csv`, mailto, mailBody });
  } catch (err) {
    console.error('generate-supplier-csv error', err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

module.exports = router;
