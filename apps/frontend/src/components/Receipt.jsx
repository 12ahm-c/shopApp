import { useRef } from 'react';
import { Printer, Store, Phone, Hash, ReceiptText, User, PackageSearch, CreditCard, Smartphone, Wallet, Banknote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useSettingsStore from '../stores/settingsStore';
import { formatMoney, formatDateTime } from '../lib/format';

const paymentLabels = {
  cash: 'payment.cash',
  card: 'payment.card',
  bankily: 'payment.bankily',
  alsadd: 'payment.alsadd',
  bimbank: 'payment.bimbank',
  masrafi: 'payment.masrafi'
};

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  bankily: Smartphone,
  alsadd: Wallet,
  bimbank: Smartphone,
  masrafi: Wallet
};

export default function Receipt({ data, showActions = true, storeOverrides = {} }) {
  const { t, i18n } = useTranslation();
  const receiptRef = useRef(null);
  const settings = useSettingsStore((state) => state.settings);
  const isRtl = i18n.language === 'ar';

  const storeName = storeOverrides.storeName || settings?.storeName || t('store_name');
  const storePhone = storeOverrides.storePhone || settings?.storePhone || '';
  const storeId = storeOverrides.storeId || '';
  const storeAddress = storeOverrides.storeAddress || settings?.storeAddress || '';
  const invoiceFooter = storeOverrides.invoiceFooter || settings?.invoiceFooter || t('receipt.thanks');

  const items = data.items || [];
  const totalAmount = data.totalAmount || items.reduce((sum, item) => sum + item.total, 0);
  const paymentLabel = t(paymentLabels[data.paymentMethod] || data.paymentMethod);

  const generatePrintHTML = () => {
    const dir = isRtl ? 'rtl' : 'ltr';

    return `<!DOCTYPE html>
<html dir="${dir}">
<head>
  <title>${t('receipt.title')} #${data.invoiceNumber}</title>
  <style>
    @page { margin: 0; size: 80mm auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      color: #1e293b;
      width: 80mm;
      padding: 0;
      line-height: 1.5;
    }
    .print-header {
      background: linear-gradient(135deg, #1e3a5f 0%, #0f2b4a 100%);
      color: #fff;
      padding: 16px 14px 14px;
      text-align: center;
    }
    .print-header .brand-icon { font-size: 22px; margin-bottom: 4px; }
    .print-header h1 { font-size: 18px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; }
    .print-header .details-row {
      display: flex; justify-content: center; gap: 16px; font-size: 9px; opacity: 0.9; flex-wrap: wrap;
    }
    .print-header .details-row span { display: inline-flex; align-items: center; gap: 4px; }
    .print-body { padding: 10px 14px; }
    .print-card {
      background: #f8fafc;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
      border: 1px solid #e2e8f0;
    }
    .print-info-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px;
    }
    .print-info-item {
      display: flex; flex-direction: column;
    }
    .print-info-item .label {
      font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px;
      color: #64748b; font-weight: 600;
    }
    .print-info-item .value {
      font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 1px;
    }
    .print-divider { border: none; border-top: 1px dashed #cbd5e1; margin: 8px 0; }
    .print-table { width: 100%; border-collapse: collapse; }
    .print-table thead th {
      font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px;
      color: #64748b; font-weight: 700; padding: 4px 2px 6px;
      border-bottom: 2px solid #e2e8f0; text-align: ${isRtl ? 'right' : 'left'};
    }
    .print-table thead th:nth-child(2),
    .print-table thead th:nth-child(3),
    .print-table thead th:nth-child(4) { text-align: right; }
    .print-table tbody td { padding: 4px 2px; font-size: 10px; color: #1e293b; border-bottom: 1px solid #f1f5f9; }
    .print-table tbody td:nth-child(2),
    .print-table tbody td:nth-child(3),
    .print-table tbody td:nth-child(4) { text-align: right; }
    .print-total-box {
      background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%);
      color: #fff;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex; justify-content: space-between; align-items: center;
      margin: 8px 0;
    }
    .print-total-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; }
    .print-total-box .amount { font-size: 18px; font-weight: 800; }
    .print-payment {
      text-align: center;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 8px 12px;
      margin: 8px 0;
      font-size: 10px;
      color: #166534;
    }
    .print-payment strong { font-size: 12px; }
    .print-footer { text-align: center; padding-top: 4px; }
    .print-footer .thanks { font-size: 10px; color: #64748b; font-style: italic; margin-bottom: 4px; }
    .print-footer .credit { font-size: 8px; color: #94a3b8; margin-top: 4px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="print-header">
    <div class="brand-icon">🛍️</div>
    <h1>${storeName}</h1>
    <div class="details-row">
      ${storePhone ? `<span>📞 ${storePhone}</span>` : ''}
      ${storeId ? `<span>🆔 ${storeId}</span>` : ''}
    </div>
  </div>

  <div class="print-body">
    <div class="print-card">
      <div class="print-info-grid">
        <div class="print-info-item">
          <span class="label">${t('receipt.invoice')}</span>
          <span class="value">${isRtl ? '#' : '#'}${data.invoiceNumber}</span>
        </div>
        <div class="print-info-item" style="text-align:${isRtl ? 'left' : 'right'}">
          <span class="label">${t('invoice.from')}</span>
          <span class="value" style="font-size:10px">${formatDateTime(data.createdAt)}</span>
        </div>
        <div class="print-info-item">
          <span class="label">${t('table.employee')}</span>
          <span class="value" style="font-size:10px">${data.employeeName}</span>
        </div>
        <div class="print-info-item" style="text-align:${isRtl ? 'left' : 'right'}">
          <span class="label">${t('invoice.client')}</span>
          <span class="value" style="font-size:10px">${data.customerName}</span>
        </div>
      </div>
    </div>

    <hr class="print-divider">

    <table class="print-table">
      <thead>
        <tr>
          <th>${t('table.product')}</th>
          <th style="text-align:right">${t('table.quantity')}</th>
          <th style="text-align:right">${t('pos.unitPrice')}</th>
          <th style="text-align:right">${t('table.total')}</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${formatMoney(item.unitPrice)}</td>
            <td>${formatMoney(item.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="print-total-box">
      <span class="label">${t('invoice.totalGeneral')}</span>
      <span class="amount">${formatMoney(totalAmount)}</span>
    </div>

    <div class="print-payment">
      💳 ${t('invoice.paymentMethod')}: <strong>${paymentLabel}</strong>
    </div>

    <hr class="print-divider">

    <div class="print-footer">
      <p class="thanks">${invoiceFooter}</p>
      <hr class="print-divider" style="margin:4px 0">
      <p class="credit">${t('receipt.generatedBy')} ShopManager</p>
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

  const handleWhatsAppShare = () => {
    const itemsText = items.map(item => 
      `  ${item.name}  x${item.quantity}  ${formatMoney(item.total)}`
    ).join('\n');

    const invoiceUrl = `${window.location.origin}/invoices/view/${data._id}`;

    const message = `🛍️ *${storeName}*
━━━━━━━━━━━━━━━━━━
📋 ${t('receipt.invoice')} #${data.invoiceNumber}
📅 ${formatDateTime(data.createdAt)}
👤 ${t('table.employee')}: ${data.employeeName}
👤 ${t('invoice.client')}: ${data.customerName}
━━━━━━━━━━━━━━━━━━
${itemsText}
━━━━━━━━━━━━━━━━━━
💰 *${t('invoice.totalGeneral')}: ${formatMoney(totalAmount)}*
💳 ${t('invoice.paymentMethod')}: ${paymentLabel}
━━━━━━━━━━━━━━━━━━
${invoiceFooter}

🔗 ${invoiceUrl}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const PaymentIcon = paymentIcons[data.paymentMethod] || Wallet;

  return (
    <div className="flex flex-col items-center">
      <div
        ref={receiptRef}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
      >
        {/* Brand Header */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-blue-900 px-6 pt-6 pb-5 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 mb-3">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wider text-white uppercase">
            {storeName}
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2 text-white/80 text-xs font-medium">
            {storePhone && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
                <Phone className="w-3 h-3" />
                {storePhone}
              </span>
            )}
            {storeId && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
                <Hash className="w-3 h-3" />
                {storeId}
              </span>
            )}
          </div>
          {storeAddress && (
            <p className="text-white/60 text-xs mt-2">{storeAddress}</p>
          )}
        </div>

        {/* Info Cards */}
        <div className="px-5 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                {t('receipt.invoice')}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <ReceiptText className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-base font-bold text-slate-900">{'#'}{data.invoiceNumber}</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                {t('invoice.from')}
              </span>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                {formatDateTime(data.createdAt)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                {t('table.employee')}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-sm font-semibold text-slate-800">{data.employeeName}</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                {t('invoice.client')}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-sm font-semibold text-slate-800">{data.customerName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-5 py-3">
          <div className="flex items-center gap-2 mb-3">
            <PackageSearch className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('invoice.productsSold')}
            </span>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left pb-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  {t('table.product')}
                </th>
                <th className="text-right pb-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  {t('table.quantity')}
                </th>
                <th className="text-right pb-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  {t('pos.unitPrice')}
                </th>
                <th className="text-right pb-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  {t('table.total')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 pr-2 font-medium text-slate-800 text-sm">{item.name}</td>
                  <td className="py-2.5 text-right text-slate-700">{item.quantity}</td>
                  <td className="py-2.5 text-right text-slate-600">{formatMoney(item.unitPrice)}</td>
                  <td className="py-2.5 text-right font-semibold text-slate-800">
                    {formatMoney(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Total */}
        <div className="px-5 pb-2">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl px-5 py-4 flex justify-between items-center shadow-lg shadow-blue-200/50">
            <span className="text-white/90 text-sm font-semibold uppercase tracking-wider">
              {t('invoice.totalGeneral')}
            </span>
            <span className="text-white text-2xl font-extrabold tracking-tight">
              {formatMoney(totalAmount)}
            </span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="px-5 pb-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2">
            <PaymentIcon className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-emerald-800 font-medium">
              {t('invoice.paymentMethod')}: <strong>{paymentLabel}</strong>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-1 text-center">
          <div className="border-t border-dashed border-slate-200 pt-4" />
          <p className="text-sm text-slate-500 italic leading-relaxed">
            {invoiceFooter}
          </p>
          <div className="border-t border-dashed border-slate-200 my-3" />
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">
            {t('receipt.generatedBy')} ShopManager
          </p>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-3 mt-5 w-full max-w-md">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Printer className="w-5 h-5" />
            {t('receipt.print')}
          </button>
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {t('receipt.whatsapp')}
          </button>
        </div>
      )}
    </div>
  );
}
