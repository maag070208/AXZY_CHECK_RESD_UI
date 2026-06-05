import { ITText } from "@axzydev/axzy_ui_system";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

interface SummaryBlock {
  total: number;
  count: number;
}

interface Props {
  paid: SummaryBlock;
  pending: SummaryBlock;
  isResident?: boolean;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

const PaymentSummaryCards = ({ paid, pending, isResident }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-4">
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between group">
      <div className="flex flex-col">
        <ITText className="font-black text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-0.5">
          {isResident ? "Total Pagado" : "Total Recaudado"}
        </ITText>
        <ITText className="font-black text-2xl tracking-tighter text-slate-800">
          {formatCurrency(paid.total)}
        </ITText>
        <ITText className="font-bold text-[9px] uppercase tracking-widest text-emerald-500 mt-1">
          {paid.count} {paid.count === 1 ? "Pago al corriente" : "Pagos al corriente"}
        </ITText>
      </div>
      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-300">
        <FaArrowUp size={18} />
      </div>
    </div>

    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between group">
      <div className="flex flex-col">
        <ITText className="font-black text-[10px] uppercase tracking-[0.15em] text-slate-400 mb-0.5">
          Total Pendiente
        </ITText>
        <ITText className="font-black text-2xl tracking-tighter text-slate-800">
          {formatCurrency(pending.total)}
        </ITText>
        <ITText className="font-bold text-[9px] uppercase tracking-widest text-rose-500 mt-1">
          {pending.count} {pending.count === 1 ? "Pago atrasado" : "Pagos atrasados"}
        </ITText>
      </div>
      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-300">
        <FaArrowDown size={18} />
      </div>
    </div>
  </div>
);

export default PaymentSummaryCards;
