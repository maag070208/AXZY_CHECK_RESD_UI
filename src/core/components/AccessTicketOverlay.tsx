import { showToast } from "@app/core/store/toast/toast.slice";
import { AccessResponse } from "@app/modules/accesses/services/AccessesService";
import { ITButton, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import React from "react";
import { FaCopy, FaTimes, FaWhatsapp } from "react-icons/fa";
import { useDispatch } from "react-redux";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  access: AccessResponse | null;
  qrCodeUrl: string;
}

export const AccessTicketOverlay: React.FC<Props> = ({
  isOpen,
  onClose,
  access,
  qrCodeUrl,
}) => {
  const dispatch = useDispatch();

  if (!isOpen || !access) return null;

  const formatAccessType = (type: string) => {
    switch (type) {
      case "TEMPORARY":
        return "TEMPORAL";
      case "RECURRING":
        return "RECURRENTE";
      case "DELIVERY":
        return "DELIVERY / SERVICIO";
      case "SERVICE":
        return "SERVICIOS PÚBLICOS";
      default:
        return type;
    }
  };

  const handleWhatsAppShare = () => {
    const shareText = `Pase de Acceso CheckApp\n\n*Invitado:* ${access.visitor?.name || "SIN NOMBRE"}\n*Código:* ${access.qrCode || "SIN CÓDIGO"}\n*Destino:* Casa ${access.resident?.house?.number || ""} (${access.resident?.house?.street || ""})\n*Válido hasta:* ${dayjs(access.validUntil).format("DD/MM/YYYY HH:mm")}\n\nPresentar este pase al ingresar.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const generateTicketCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const canvas = document.createElement("canvas");
    const scale = 4; // 4x scale for maximum resolution
    const baseWidth = 340;
    const baseHeight = 560;

    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.scale(scale, scale);

    // Draw background card (white with rounded corners)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(0, 0, baseWidth, baseHeight, 24);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(0, 0, baseWidth, baseHeight, 24);
    ctx.stroke();

    // Draw green header
    ctx.fillStyle = "#065911";
    ctx.beginPath();
    ctx.roundRect(0, 0, baseWidth, 110, [24, 24, 0, 0]);
    ctx.fill();

    // Draw header text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PASE DE ACCESO", 170, 50);

    ctx.font = "bold 8px sans-serif";
    ctx.fillText("CHECKAPP SECURITY", 170, 68);

    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.roundRect(240, 15, 85, 18, 9);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8px sans-serif";
    ctx.fillText(formatAccessType(access.type) || "VISITA", 282, 27);

    // Draw QR code image
    const qrImg = new Image();
    qrImg.src = qrCodeUrl;
    await new Promise((resolve) => {
      qrImg.onload = resolve;
    });
    ctx.drawImage(qrImg, 95, 130, 150, 150);

    // Draw QR code border
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(90, 125, 160, 160, 16);
    ctx.stroke();

    // Draw code text
    ctx.fillStyle = "#334155";
    ctx.font = "bold 13px monospace";
    ctx.fillText(access.qrCode || "", 170, 315);

    // Draw Guest details
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 8px sans-serif";
    ctx.fillText("INVITADO", 170, 350);

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(access.visitor?.name || "", 170, 370);

    // Draw divider line
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(30, 395);
    ctx.lineTo(310, 395);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Destination details
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 8px sans-serif";
    ctx.fillText("DESTINO", 170, 420);

    ctx.fillStyle = "#334155";
    ctx.font = "bold 11px sans-serif";
    const houseNum = access.resident?.house?.number || "";
    const houseStreet = access.resident?.house?.street || "";
    ctx.fillText(`CASA ${houseNum} - ${houseStreet}`.toUpperCase(), 170, 440);

    // Draw Validity badge
    ctx.fillStyle = "#edfcf2";
    ctx.beginPath();
    ctx.roundRect(40, 470, 260, 35, 10);
    ctx.fill();

    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(40, 470, 260, 35, 10);
    ctx.stroke();

    ctx.fillStyle = "#047857";
    ctx.font = "bold 9px sans-serif";
    const validStr = `VÁLIDO HASTA ${dayjs(access.validUntil).format("DD/MM/YYYY HH:mm")}`;
    ctx.fillText(validStr, 170, 492);

    // Draw footer text
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 7px sans-serif";
    ctx.fillText("PRESENTAR ESTE CÓDIGO EN CASETA DE SEGURIDAD", 170, 535);

    return canvas;
  };

  const handleCopyImage = async () => {
    try {
      dispatch(
        showToast({
          message: "Copiando imagen en alta calidad...",
          type: "info",
        }),
      );
      const canvas = await generateTicketCanvas();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          dispatch(
            showToast({
              message: "¡Imagen del pase copiada al portapapeles!",
              type: "success",
            }),
          );
        } catch (err) {
          console.error(err);
          dispatch(
            showToast({ message: "Error al copiar la imagen", type: "error" }),
          );
        }
      }, "image/png");
    } catch (error) {
      console.error(error);
      dispatch(
        showToast({ message: "Error al generar la imagen", type: "error" }),
      );
    }
  };


  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-100/70 backdrop-blur-md flex flex-col items-center justify-center z-[9999] p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      {/* Fixed top-right close button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[10000] text-slate-700 hover:text-slate-900 transition-colors bg-white/90 hover:bg-white p-3 rounded-full shadow-lg border border-slate-200/50 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 duration-150"
        title="Cerrar"
      >
        <FaTimes size={20} />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[340px] animate-in zoom-in-95 duration-300 cursor-default"
      >
        {/* Close button on top right of the ticket */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-slate-700 hover:text-slate-900 transition-colors bg-slate-200/80 hover:bg-slate-300 p-2.5 rounded-full shadow-sm"
          title="Cerrar"
        >
          <FaTimes size={18} />
        </button>

        {/* Ticket Card */}
        <div className="bg-white w-full rounded-[2rem] shadow-2xl overflow-hidden flex flex-col items-center relative border border-slate-200/50 mx-auto animate-in slide-in-from-bottom-8 duration-500">
          {/* Green Header */}
          <div className="bg-[#065911] w-full py-5 px-4 flex flex-col items-center text-white relative">
            <div className="absolute right-4 top-4 bg-white/20 text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white backdrop-blur-md">
              {formatAccessType(access.type)}
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1.5 border border-white/20">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <ITText className="font-black text-xs tracking-wider uppercase">
              PASE DE ACCESO
            </ITText>
            <ITText className="text-[7px] font-black opacity-60 tracking-[0.2em] uppercase mt-0.5">
              CHECKAPP SECURITY
            </ITText>
          </div>

          {/* Ticket Body */}
          <div className="p-6 w-full flex flex-col items-center space-y-4">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner flex items-center justify-center">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={`QR de ${access.visitor?.name}`}
                  className="w-36 h-36 rounded-xl"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center">
                  <ITText className="text-slate-400 text-xs">
                    Cargando...
                  </ITText>
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl px-6 py-1.5 shadow-sm">
              <ITText className="font-mono font-bold text-slate-700 text-xs tracking-[0.25em]">
                {access.qrCode}
              </ITText>
            </div>

            <div className="text-center w-full">
              <ITText className="text-slate-400 text-[8px] font-black uppercase tracking-[0.2em] block">
                INVITADO
              </ITText>
              <ITText className="font-black text-slate-800 text-sm uppercase tracking-tight block mt-0.5">
                {access.visitor?.name}
              </ITText>
            </div>

            <div className="w-full border-t border-dashed border-slate-200 my-1" />

            <div className="text-center w-full space-y-0.5">
              <ITText className="text-slate-400 text-[8px] font-black uppercase tracking-[0.2em] block">
                DESTINO
              </ITText>
              <ITText className="font-black text-slate-700 text-[10px] uppercase block">
                CASA {access.resident?.house?.number}
              </ITText>
              <ITText className="text-slate-500 text-[9px] font-semibold uppercase block">
                {access.resident?.house?.street}
              </ITText>
              <ITText className="text-slate-400 text-[8px] font-medium block">
                Autorizó: {access.resident?.user?.name}{" "}
                {access.resident?.user?.lastName || ""}
              </ITText>
            </div>

            <div className="w-full pt-2">
              <div className="border border-emerald-500 bg-[#edfcf2] rounded-xl py-2 text-center flex items-center justify-center gap-1 px-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <ITText className="text-emerald-700 text-[8px] font-black uppercase tracking-widest">
                  VÁLIDO HASTA{" "}
                  {dayjs(access.validUntil).format("DD/MM/YYYY HH:mm")}
                </ITText>
              </div>
            </div>

            <div className="pt-1 text-center">
              <ITText className="text-slate-400 text-[7px] font-bold uppercase tracking-wider">
                Presentar este código en caseta de seguridad
              </ITText>
            </div>
          </div>
        </div>

        {/* Floating Action Buttons Row */}
        <div className="mt-6 flex flex-col gap-2.5 w-full">
          <div className="flex gap-2">
            <ITButton
              onClick={handleWhatsAppShare}
              color="success"
              className="flex-1 shadow-md"
            >
              <div className="flex items-center justify-center gap-1.5">
                <FaWhatsapp size={14} />
                <span className="text-[11px] font-bold">WhatsApp</span>
              </div>
            </ITButton>
            <ITButton
              onClick={handleCopyImage}
              color="purple"
              className="flex-1 shadow-md"
            >
              <div className="flex items-center justify-center gap-1.5">
                <FaCopy size={14} />
                <span className="text-[11px] font-bold">Copiar Imagen</span>
              </div>
            </ITButton>
          </div>
          <ITButton
            onClick={onClose}
            color="gray"
            className="w-full"
            variant="text"
          >
            <div className="flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-700">
              <FaTimes size={12} />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Cerrar
              </span>
            </div>
          </ITButton>
        </div>
      </div>
    </div>
  );
};
