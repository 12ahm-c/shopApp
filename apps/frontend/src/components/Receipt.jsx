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
  const emptyRows = Math.max(0, 2 - items.length);

  const generatePrintHTML = () => {
    const dir = 'rtl';
    const dateStr = new Date(data.createdAt).toLocaleDateString('ar-MR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const timeStr = new Date(data.createdAt).toLocaleTimeString('ar-MR', { hour: '2-digit', minute: '2-digit' });

    const itemRows = items.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="col-product">${item.name}</td>
        <td>${item.quantity}</td>
        <td>${formatMoney(item.unitPrice)}</td>
        <td class="font-bold">${formatMoney(item.total)}</td>
      </tr>
    `).join('');

    const emptyRowHTML = `<tr class="empty-rows"><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>`;
    const emptyRowsHTML = Array.from({ length: emptyRows }, () => emptyRowHTML).join('');

    return `<!DOCTYPE html>
<html dir="${dir}">
<head>
  <title>فاتورة #${data.invoiceNumber}</title>
  <style>
    @page { margin: 12mm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
      font-size: 12px;
      color: #000;
      line-height: 1.5;
      padding: 10mm;
    }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 3px double #000; margin-bottom: 12px; }
    .store-info { text-align: right; }
    .store-info h1 { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .store-info .phone { font-size: 12px; color: #444; margin-top: 2px; }
    .invoice-info { text-align: left; }
    .invoice-info .inv-label { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
    .invoice-info .inv-number { font-size: 18px; font-weight: 900; color: #000; }
    .invoice-info .inv-date { font-size: 11px; color: #555; margin-top: 4px; }
    .logo { max-width: 70px; max-height: 70px; object-fit: contain; margin-bottom: 4px; margin-left: auto; }

    /* Customer info */
    .customer-section { display: flex; gap: 30px; margin-bottom: 12px; font-size: 12px; }
    .customer-section .field { display: flex; align-items: center; gap: 6px; }
    .customer-section .label { font-weight: 700; min-width: 65px; }
    .customer-section .value { border-bottom: 1px solid #ccc; min-width: 140px; padding-bottom: 1px; }

    /* Table */
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #000; padding: 5px 6px; text-align: center; font-size: 11px; }
    th { background: #e8e8e8; font-weight: 700; font-size: 11px; }
    .col-num { width: 32px; }
    .col-product { width: auto; text-align: right !important; padding-right: 10px !important; }
    .col-qty { width: 55px; }
    .col-price { width: 85px; }
    .col-total { width: 85px; }
    .empty-rows td { height: 24px; }

    /* Footer */
    .footer { margin-top: 10px; }
    .total-row { display: flex; justify-content: flex-end; margin-bottom: 10px; }
    .total-box { border: 2px solid #000; padding: 6px 18px; font-size: 14px; font-weight: 900; background: #f5f5f5; }
    .payment-row { display: flex; gap: 40px; margin-bottom: 12px; font-size: 12px; justify-content: flex-end; }
    .payment-row .item { display: flex; align-items: center; gap: 6px; }
    .payment-row .label { font-weight: 700; }
    .payment-row .line { border-bottom: 1px solid #999; min-width: 90px; text-align: center; padding-bottom: 1px; }

    .bottom-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; padding-top: 10px; }
    .seller-section { font-size: 11px; }
    .seller-section .label { font-weight: 700; margin-bottom: 2px; }
    .seller-section .line { border-bottom: 1px solid #999; min-width: 120px; margin-top: 25px; }
    .signature-section { text-align: center; }
    .signature-section .sig-label { font-size: 11px; font-weight: 700; margin-bottom: 2px; }
    .signature-section .sig-line { border-bottom: 1px solid #999; min-width: 150px; margin: 25px auto 0; }
    .signature-section .sig-img { max-height: 50px; margin-top: 4px; }
    .stamp-section { text-align: center; }
    .stamp-section .stamp-label { font-size: 11px; font-weight: 700; }
    .stamp-section .stamp-line { border-bottom: 1px solid #999; min-width: 120px; margin: 25px auto 0; }

    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-info">
      ${storeLogo ? `<img src="${storeLogo}" class="logo" />` : ''}
      <h1>${storeName}</h1>
      ${storePhone ? `<div class="phone">✆ ${storePhone}</div>` : ''}
    </div>
    <div class="invoice-info">
      <div class="inv-label">فاتورة مبيعات</div>
      <div class="inv-number">#${data.invoiceNumber || ''}</div>
      <div class="inv-date">${dateStr} — ${timeStr}</div>
    </div>
  </div>

  <div class="customer-section">
    <div class="field">
      <span class="label">الزبون :</span>
      <span class="value">${data.customerName || '—'}</span>
    </div>
    <div class="field">
      <span class="label">البائع :</span>
      <span class="value">${data.employeeName || '—'}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="col-num">#</th>
        <th class="col-product">المنتج</th>
        <th class="col-qty">الكمية</th>
        <th class="col-price">سعر الوحدة</th>
        <th class="col-total">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${emptyRowsHTML}
    </tbody>
  </table>

  <div class="footer">
    <div class="total-row">
      <div class="total-box">المبلغ الإجمالي : ${formatMoney(totalAmount)}</div>
    </div>

    <div class="payment-row">
      <div class="item">
        <span class="label">المدفوع :</span>
        <span class="line">${formatMoney(effectivePaid)}</span>
      </div>
      <div class="item">
        <span class="label">الباقي :</span>
        <span class="line">${formatMoney(effectiveChange)}</span>
      </div>
    </div>

    <div class="bottom-section">
      <div class="seller-section">
        <div class="label">توقيع البائع</div>
        <div class="line"></div>
      </div>
      <div class="signature-section">
        <div class="sig-label">التوقيع والختم</div>
        ${invoiceSignature ? `<img src="${invoiceSignature}" class="sig-img" />` : '<div class="sig-line"></div>'}
      </div>
      <div class="stamp-section">
        <div class="stamp-label">ختم المتجر</div>
        <div class="stamp-line"></div>
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
        <div className="flex justify-between items-start px-6 pt-6 pb-4 border-b-[3px] border-b-double border-slate-900">
          <div className="text-right">
            {storeLogo && (
              <img src={storeLogo} alt={storeName} className="w-16 h-16 object-contain mb-2 ml-auto" />
            )}
            <h1 className="text-xl font-black leading-tight">{storeName}</h1>
            {storePhone && (
              <div className="flex items-center justify-end gap-1.5 mt-1 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5" />
                <span>{storePhone}</span>
              </div>
            )}
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-500 mb-1">فاتورة مبيعات</div>
            <div className="text-lg font-black">#{data.invoiceNumber || ''}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {new Date(data.createdAt).toLocaleDateString('ar-MR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
              {' — '}
              {new Date(data.createdAt).toLocaleTimeString('ar-MR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Customer & Seller */}
        <div className="flex gap-6 px-6 py-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">الزبون :</span>
            <span className="border-b border-slate-300 min-w-[120px] text-center pb-0.5 font-medium">
              {data.customerName || '—'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">البائع :</span>
            <span className="border-b border-slate-300 min-w-[120px] text-center pb-0.5 font-medium">
              {data.employeeName || '—'}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="px-6 pb-3">
          <table className="w-full border-collapse border border-slate-900 text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-900 py-1.5 px-1 w-8 font-bold text-[11px]">#</th>
                <th className="border border-slate-900 py-1.5 px-2 text-right font-bold text-[11px]">المنتج</th>
                <th className="border border-slate-900 py-1.5 px-1 w-12 font-bold text-[11px]">الكمية</th>
                <th className="border border-slate-900 py-1.5 px-1 w-20 font-bold text-[11px]">سعر الوحدة</th>
                <th className="border border-slate-900 py-1.5 px-1 w-20 font-bold text-[11px]">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="border border-slate-900 py-1.5 px-1 text-center">{i + 1}</td>
                  <td className="border border-slate-900 py-1.5 px-2 text-right font-medium">{item.name}</td>
                  <td className="border border-slate-900 py-1.5 px-1 text-center">{item.quantity}</td>
                  <td className="border border-slate-900 py-1.5 px-1 text-center">{formatMoney(item.unitPrice)}</td>
                  <td className="border border-slate-900 py-1.5 px-1 text-center font-bold">{formatMoney(item.total)}</td>
                </tr>
              ))}
              {Array.from({ length: emptyRows }, (_, i) => (
                <tr key={`empty-${i}`} className="h-6">
                  <td className="border border-slate-900">&nbsp;</td>
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
          <div className="flex justify-end mb-3">
            <div className="border-2 border-slate-900 px-4 py-2 text-sm font-black bg-slate-50">
              المبلغ الإجمالي : {formatMoney(totalAmount)}
            </div>
          </div>

          <div className="flex gap-8 mb-4 text-xs justify-end">
            <div className="flex items-center gap-2">
              <span className="font-bold">المدفوع :</span>
              <span className="border-b border-slate-300 min-w-[80px] text-center pb-0.5">
                {formatMoney(effectivePaid)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">الباقي :</span>
              <span className="border-b border-slate-300 min-w-[80px] text-center pb-0.5">
                {formatMoney(effectiveChange)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-end mt-6 pt-2">
            <div>
              <div className="text-[11px] font-bold text-slate-500">توقيع البائع</div>
              <div className="border-b border-slate-300 min-w-[100px] mt-8"></div>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-bold text-slate-500">التوقيع والختم</div>
              {invoiceSignature ? (
                <img src={invoiceSignature} alt="Signature" className="max-h-12 mt-1 mx-auto" />
              ) : (
                <div className="border-b border-slate-300 min-w-[130px] mt-8 mx-auto"></div>
              )}
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500">ختم المتجر</div>
              <div className="border-b border-slate-300 min-w-[100px] mt-8"></div>
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
