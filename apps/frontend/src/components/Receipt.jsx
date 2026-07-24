import { useRef } from 'react';
import { Phone, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useSettingsStore from '../stores/settingsStore';
import { formatMoney } from '../lib/format';

export default function Receipt({ data, showActions = true }) {
  const { t } = useTranslation();
  const receiptRef = useRef(null);
  const settings = useSettingsStore((state) => state.settings);

  const storeName = settings?.storeName || t('store_name');
  const storePhone = settings?.storePhone || '';
  const storeLogo = settings?.storeLogo || null;
  const invoiceSignature = settings?.invoiceSignature || '';

  const items = data.items || [];
  const totalAmount = data.totalAmount || items.reduce((sum, item) => sum + item.total, 0);
  const paidAmount = data.paidAmount || totalAmount;
  const effectivePaid = paidAmount;
  const effectiveChange = Math.max(0, effectivePaid - totalAmount);

  const generatePrintHTML = () => {
    const dir = 'rtl';
    const dateStr = new Date(data.createdAt).toLocaleDateString('ar-MR', { year: 'numeric', month: '2-digit', day: '2-digit' });

    return `<!DOCTYPE html>
<html dir="${dir}">
<head>
  <title>فاتورة #${data.invoiceNumber}</title>
  <style>
    @page { margin: 10mm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
      font-size: 12px;
      color: #000;
      line-height: 1.6;
      padding: 15mm;
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
    .header-right { text-align: right; }
    .header-right h1 { font-size: 22px; font-weight: 900; margin-bottom: 2px; }
    .header-right .tagline { font-size: 13px; color: #333; margin-bottom: 8px; }
    .header-right .phones { font-size: 13px; display: flex; align-items: center; gap: 6px; justify-content: flex-end; }
    .header-left { text-align: left; }
    .header-left .invoice-label { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
    .date-box { border: 1px solid #000; padding: 4px 12px; display: inline-block; font-size: 13px; }
    .info-section { margin: 15px 0; }
    .info-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
    .info-row .label { font-weight: 700; min-width: 100px; }
    .info-row .line { flex: 1; border-bottom: 1px dotted #999; min-height: 20px; }
    .info-row .value { min-width: 120px; border-bottom: 1px dotted #999; text-align: center; padding: 0 8px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 12px; }
    th { background: #f0f0f0; font-weight: 700; font-size: 13px; }
    .col-num { width: 40px; }
    .col-product { width: auto; text-align: right !important; }
    .col-qty { width: 70px; }
    .col-price { width: 100px; }
    .col-total { width: 100px; }
    .empty-rows td { height: 28px; }
    .footer-section { margin-top: 20px; }
    .total-box { display: flex; justify-content: flex-start; margin-bottom: 15px; }
    .total-box .box { border: 2px solid #000; padding: 8px 20px; font-size: 15px; font-weight: 700; }
    .payment-row { display: flex; gap: 30px; margin-bottom: 20px; font-size: 13px; }
    .payment-row .item { display: flex; align-items: center; gap: 8px; }
    .payment-row .label { font-weight: 700; }
    .payment-row .line { border-bottom: 1px dotted #999; min-width: 100px; }
    .signature-section { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .signature-section .sig-label { font-size: 13px; font-weight: 700; }
    .signature-section .sig-line { border-bottom: 1px dotted #999; min-width: 200px; margin-top: 30px; }
    .signature-section .sig-text { font-size: 11px; color: #666; margin-top: 5px; }
    .logo { max-width: 80px; max-height: 80px; object-fit: contain; margin-bottom: 5px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="invoice-label">فاتورة رقم ${data.invoiceNumber || ''}</div>
      <div class="date-box">${dateStr} /</div>
    </div>
    <div class="header-right">
      ${storeLogo ? `<img src="${storeLogo}" class="logo" />` : ''}
      <h1>${storeName}</h1>
      ${storePhone ? `<div class="phones">✆ ${storePhone}</div>` : ''}
    </div>
  </div>

  <div class="info-section">
    <div class="info-row">
      <span class="label">الزبون :</span>
      <span class="value">${data.customerName || '........................'}</span>
    </div>
    <div class="info-row">
      <span class="label">اسم البائع :</span>
      <span class="value">${data.employeeName || '........................'}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="col-num">رقم</th>
        <th class="col-product">المنتج</th>
        <th class="col-qty">الكمية</th>
        <th class="col-price">سعر الوحدة</th>
        <th class="col-total">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td class="col-product">${item.name}</td>
          <td>${item.quantity}</td>
          <td>${formatMoney(item.unitPrice)}</td>
          <td>${formatMoney(item.total)}</td>
        </tr>
      `).join('')}
      ${Array.from({ length: Math.max(0, 12 - items.length) }, () => `
        <tr class="empty-rows">
          <td>&nbsp;</td><td></td><td></td><td></td><td></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer-section">
    <div class="total-box">
      <div class="box">المبلغ الإجمالي : ${formatMoney(totalAmount)}</div>
    </div>

    <div class="payment-row">
      <div class="item">
        <span class="label">الباقي :</span>
        <span class="line">${formatMoney(effectiveChange)}</span>
      </div>
      <div class="item">
        <span class="label">المدفوع :</span>
        <span class="line">${formatMoney(effectivePaid)}</span>
      </div>
    </div>

    <div class="signature-section">
      <div>
        <div class="sig-label">التوقيع والختم</div>
        <div class="sig-line"></div>
        ${invoiceSignature ? `<img src="${invoiceSignature}" style="max-height:60px;margin-top:5px;" />` : ''}
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generatePrintHTML());
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div className="flex flex-col items-center" dir="rtl">
      <div
        ref={receiptRef}
        className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-start px-6 pt-6 pb-4 border-b-2 border-slate-900">
          <div className="text-left">
            <div className="text-sm font-bold mb-2">فاتورة رقم {data.invoiceNumber || ''}</div>
            <div className="border border-slate-900 px-3 py-1 inline-block text-sm">
              {new Date(data.createdAt).toLocaleDateString('ar-MR', { year: 'numeric', month: '2-digit', day: '2-digit' })} /
            </div>
          </div>
          <div className="text-right">
            {storeLogo && (
              <img src={storeLogo} alt={storeName} className="w-20 h-20 object-contain mb-2 ml-auto" />
            )}
            <h1 className="text-2xl font-black">{storeName}</h1>
            {storePhone && (
              <div className="flex items-center justify-end gap-2 mt-1 text-sm">
                <Phone className="w-4 h-4" />
                <span>{storePhone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer & Seller */}
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-bold min-w-[80px]">الزبون :</span>
            <span className="flex-1 border-b border-dotted border-slate-400 text-center pb-1">
              {data.customerName || ''}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-bold min-w-[80px]">اسم البائع :</span>
            <span className="flex-1 border-b border-dotted border-slate-400 text-center pb-1">
              {data.employeeName || ''}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="px-6 pb-4">
          <table className="w-full border-collapse border border-slate-900 text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-900 py-2 px-2 w-10 font-bold">رقم</th>
                <th className="border border-slate-900 py-2 px-3 text-right font-bold text-base">المنتج</th>
                <th className="border border-slate-900 py-2 px-2 w-16 font-bold">الكمية</th>
                <th className="border border-slate-900 py-2 px-2 w-24 font-bold">سعر الوحدة</th>
                <th className="border border-slate-900 py-2 px-2 w-24 font-bold">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="border border-slate-900 py-2 px-2 text-center">{i + 1}</td>
                  <td className="border border-slate-900 py-2 px-3 text-right">{item.name}</td>
                  <td className="border border-slate-900 py-2 px-2 text-center">{item.quantity}</td>
                  <td className="border border-slate-900 py-2 px-2 text-center">{formatMoney(item.unitPrice)}</td>
                  <td className="border border-slate-900 py-2 px-2 text-center font-semibold">{formatMoney(item.total)}</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 12 - items.length) }, (_, i) => (
                <tr key={`empty-${i}`} className="h-7">
                  <td className="border border-slate-900 px-2">&nbsp;</td>
                  <td className="border border-slate-900"></td>
                  <td className="border border-slate-900"></td>
                  <td className="border border-slate-900"></td>
                  <td className="border border-slate-900"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="border-2 border-slate-900 px-4 py-3 inline-block mb-4 text-lg font-bold">
            المبلغ الإجمالي : {formatMoney(totalAmount)}
          </div>

          <div className="flex gap-8 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold">الباقي :</span>
              <span className="border-b border-dotted border-slate-400 min-w-[100px] text-center pb-1">
                {formatMoney(effectiveChange)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">المدفوع :</span>
              <span className="border-b border-dotted border-slate-400 min-w-[100px] text-center pb-1">
                {formatMoney(effectivePaid)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-end mt-8">
            <div>
              <div className="text-sm font-bold mb-1">التوقيع والختم</div>
              <div className="border-b border-dotted border-slate-400 min-w-[200px] mt-8"></div>
              {invoiceSignature && (
                <img src={invoiceSignature} alt="Signature" className="max-h-16 mt-2" />
              )}
            </div>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-3 mt-5 w-full max-w-2xl">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
          >
            <Printer className="w-5 h-5" />
            طباعة
          </button>
        </div>
      )}
    </div>
  );
}
