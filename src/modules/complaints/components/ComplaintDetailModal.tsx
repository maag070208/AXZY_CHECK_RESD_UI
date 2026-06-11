import React, { useState, useEffect, useRef } from "react";
import Ably from "ably";
import dayjs from "dayjs";
import { FaCheck, FaLock, FaPaperPlane, FaComment } from "react-icons/fa";
import {
  ITBadget,
  ITButton,
  ITDialog,
  ITText,
  ITLoader,
  ITTabs,
} from "@axzydev/axzy_ui_system";
import {
  ComplaintResponse,
  ComplaintMessageResponse,
  getComplaintMessages,
  createComplaintMessage,
} from "../services/ComplaintsService";

const STATUS_FLOW = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En Proceso",
  RESOLVED: "Resuelta",
  CLOSED: "Cerrada",
};

const getStatusStep = (status: string) => STATUS_FLOW.indexOf(status as typeof STATUS_FLOW[number]);
const getAvailableTransitions = (status: string) => {
  const current = status as typeof STATUS_FLOW[number];
  const from = getStatusStep(current);
  return STATUS_FLOW.filter((_, i) => i > from).slice(0, from === 0 ? 3 : from === 1 ? 2 : 1);
};

export const getStatusBadge = (status: string) => {
  let color: "gray" | "warning" | "success" | "secondary" = "gray";
  let label = "ABIERTA";
  if (status === "IN_PROGRESS") {
    color = "warning";
    label = "EN PROCESO";
  } else if (status === "RESOLVED") {
    color = "success";
    label = "RESUELTA";
  } else if (status === "CLOSED") {
    color = "secondary";
    label = "CERRADA";
  }
  return (
    <ITBadget color={color} size="small">
      {label}
    </ITBadget>
  );
};

interface ComplaintDetailModalProps {
  complaint: ComplaintResponse;
  isOpen: boolean;
  onClose: () => void;
  isResident: boolean;
  isAdmin: boolean;
  authId: number | null;
  primaryHex: string;
  totalUnread: number;
  onUpdateStatus: (status: string) => void;
  isUpdatingStatus: boolean;
}

const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  isOpen,
  onClose,
  isResident,
  isAdmin,
  authId,
  primaryHex,
  totalUnread,
  onUpdateStatus,
  isUpdatingStatus,
}) => {
  const [messages, setMessages] = useState<ComplaintMessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const ablyRef = useRef<Ably.Realtime | null>(null);

  const loadMessages = async () => {
    setLoadingMessages(true);
    const res = await getComplaintMessages(complaint.id);
    if (res.success && res.data) {
      setMessages(res.data);
    }
    setLoadingMessages(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    const res = await createComplaintMessage(complaint.id, newMessage.trim());
    if (res.success) {
      setNewMessage("");
    }
    setSendingMessage(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    setMessages([]);
    setNewMessage("");
    loadMessages();

    const ablyKey = import.meta.env.VITE_ABLY_KEY;
    if (!ablyKey) return;

    ablyRef.current = new Ably.Realtime({ key: ablyKey });
    const channel = ablyRef.current.channels.get(`complaint:${complaint.id}`);
    channel.subscribe("message", (msg: any) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === msg.data.id);
        if (exists) return prev;
        return [...prev, msg.data];
      });
    });

    return () => {
      channel.unsubscribe();
      ablyRef.current?.close();
      ablyRef.current = null;
    };
  }, [isOpen, complaint.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title="Detalle de Queja">
      <div className="flex flex-col h-[620px] w-[600px] overflow-hidden">
        {/* Header - Más espaciado y limpio */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <ITText className="text-xs text-slate-400 font-medium mb-1">
                {complaint.category?.name}
              </ITText>
              <h4 className="text-lg font-bold text-slate-800 leading-tight">
                {complaint.title}
              </h4>
            </div>
            {getStatusBadge(complaint.status)}
          </div>
        </div>

        <ITTabs
          items={[
            {
              id: "details",
              label: "Detalles",
              content: (
                <div className="px-6 py-5 space-y-5 overflow-y-auto h-full">
                  {/* Estado cerrado */}
                  {complaint.status === "CLOSED" && (
                    <div
                      className="rounded-xl p-4 flex items-center gap-3 border"
                      style={{ backgroundColor: primaryHex + "08", borderColor: primaryHex + "20" }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: primaryHex + "15" }}
                      >
                        <FaLock size={14} style={{ color: primaryHex }} />
                      </div>
                      <div>
                        <span className="text-xs font-bold" style={{ color: primaryHex }}>
                          Queja Cerrada
                        </span>
                        <ITText className="text-xs text-slate-500 mt-0.5">
                          Esta queja está cerrada y no admite modificaciones
                        </ITText>
                      </div>
                    </div>
                  )}

                  {/* Flujo de estado - Más espaciado y legible */}
                  {complaint.status !== "CLOSED" && (
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <ITText className="text-[11px] font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                        Progreso de la Queja
                      </ITText>
                      <div className="flex items-start">
                        {STATUS_FLOW.map((s, i, arr) => {
                          const currentStep = getStatusStep(complaint.status);
                          const isPast = i < currentStep;
                          const isCurrent = i === currentStep;

                          return (
                            <div key={s} className="flex items-start flex-1">
                              <div className="flex flex-col items-center">
                                <div
                                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                                  style={{
                                    backgroundColor: isPast ? primaryHex : isCurrent ? primaryHex : "#f1f5f9",
                                    color: isPast || isCurrent ? "#fff" : "#94a3b8",
                                    boxShadow: isCurrent ? `0 0 0 3px ${primaryHex}25` : "none",
                                  }}
                                >
                                  {isPast ? <FaCheck size={12} /> : i + 1}
                                </div>
                                <span
                                  className="text-[10px] font-semibold mt-2 text-center"
                                  style={{
                                    color: isPast || isCurrent ? primaryHex : "#94a3b8",
                                  }}
                                >
                                  {STATUS_LABELS[s]}
                                </span>
                              </div>
                              {i < arr.length - 1 && (
                                <div
                                  className="flex-1 h-0.5 mt-4 -ml-1 mr-1"
                                  style={{
                                    backgroundColor: i < currentStep ? primaryHex : "#e2e8f0",
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Descripción */}
                  <div className="space-y-2">
                    <ITText className="text-xs font-semibold text-slate-400">
                      Descripción
                    </ITText>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <ITText className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                        {complaint.description}
                      </ITText>
                    </div>
                  </div>

                  {/* Información adicional - Grid más espaciada */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-100 rounded-xl p-3">
                      <ITText className="text-[10px] font-semibold text-slate-400 uppercase mb-1">
                        Fecha Registro
                      </ITText>
                      <ITText className="text-slate-700 font-semibold text-sm">
                        {dayjs(complaint.createdAt).format("DD/MM/YYYY HH:mm")}
                      </ITText>
                    </div>

                    {!isResident && (
                      <div className="bg-white border border-slate-100 rounded-xl p-3">
                        <ITText className="text-[10px] font-semibold text-slate-400 uppercase mb-1">
                          Reportado por
                        </ITText>
                        <ITText className="text-slate-700 font-semibold text-sm truncate">
                          {complaint.resident?.user?.name} {complaint.resident?.user?.lastName}
                        </ITText>
                      </div>
                    )}
                  </div>

                  {/* Resolución */}
                  {complaint.resolvedBy && (
                    <div 
                      className="rounded-xl p-4 space-y-2 border" 
                      style={{ backgroundColor: primaryHex + "06", borderColor: primaryHex + "20" }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-semibold uppercase" style={{ color: primaryHex }}>
                            Atendido / Resuelto por
                          </span>
                          <ITText className="text-slate-700 font-semibold text-sm mt-1">
                            {complaint.resolvedBy.name} {complaint.resolvedBy.lastName}
                          </ITText>
                        </div>
                        {complaint.resolvedAt && (
                          <div className="text-right">
                            <span className="text-[10px] font-semibold uppercase" style={{ color: primaryHex }}>
                              Fecha Resolución
                            </span>
                            <ITText className="text-slate-700 font-semibold text-sm mt-1">
                              {dayjs(complaint.resolvedAt).format("DD/MM/YYYY")}
                            </ITText>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Acciones de gestión - Más organizado */}
                  {isAdmin && complaint.status !== "CLOSED" && (
                    <div className="border-t border-slate-100 pt-5 mt-2">
                      <ITText className="text-xs font-semibold text-slate-400 mb-3">
                        Acciones de Gestión
                      </ITText>
                      <div className="flex flex-wrap gap-2">
                        {getAvailableTransitions(complaint.status).map((nextStatus) => {
                          interface BtnConfig {
                            variant: "filled" | "outlined";
                            color: "warning" | "success" | "secondary";
                            label: string;
                            icon?: React.ReactNode;
                          }
                          const btnProps: BtnConfig =
                            nextStatus === "IN_PROGRESS"
                              ? { variant: "outlined", color: "warning", label: "Marcar en Progreso" }
                              : nextStatus === "RESOLVED"
                              ? { variant: "filled", color: "success", label: "Resolver Queja", icon: <FaCheck size={12} /> }
                              : { variant: "filled", color: "secondary", label: "Cerrar Queja", icon: <FaLock size={12} /> };

                          return (
                            <ITButton
                              key={nextStatus}
                              variant={btnProps.variant}
                              color={btnProps.color}
                              onClick={() => onUpdateStatus(nextStatus)}
                              disabled={isUpdatingStatus}
                              size="small"
                            >
                            <div className="flex items-center gap-1">
                                {btnProps.icon && <span className="mr-1.5">{btnProps.icon}</span>}
                              {btnProps.label}
                            </div>
                            </ITButton>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: "chat",
              label: "Chat",
              icon: totalUnread > 0 ? (
                <span className="flex items-center gap-1.5">
                  <FaComment size={12} />
                  <span
                    className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full"
                    style={{ backgroundColor: primaryHex }}
                  >
                    {totalUnread}
                  </span>
                </span>
              ) : (
                <FaComment size={12} />
              ),
              content: (
                <div className="flex flex-col h-full">
                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
                    {loadingMessages ? (
                      <div className="flex justify-center py-12">
                        <ITLoader size="sm" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12">
                        <FaComment size={32} className="text-slate-300 mx-auto mb-2" />
                        <ITText className="text-sm text-slate-400">
                          No hay mensajes aún
                        </ITText>
                        <ITText className="text-xs text-slate-300 mt-1">
                          Sé el primero en escribir
                        </ITText>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = msg.userId === String(authId);
                        return (
                          <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] ${!isMine ? "pr-8" : "pl-8"}`}>
                              {!isMine && (
                                <ITText className="text-[11px] font-semibold text-slate-500 mb-1 ml-1">
                                  {msg.user?.name}
                                </ITText>
                              )}
                              <div
                                className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                                  isMine
                                    ? "text-white rounded-2xl rounded-br-md"
                                    : "bg-white border border-slate-200 rounded-2xl rounded-bl-md text-slate-700"
                                }`}
                                style={isMine ? { backgroundColor: primaryHex } : undefined}
                              >
                                {msg.message}
                              </div>
                              <ITText className="text-[10px] text-slate-400 mt-1 block text-right">
                                {dayjs(msg.createdAt).format("HH:mm")}
                              </ITText>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input area */}
                  {complaint.status === "CLOSED" ? (
                    <div className="border-t border-slate-200 px-4 py-3 bg-slate-50">
                      <div className="flex items-center gap-2 text-slate-400">
                        <FaLock size={12} />
                        <span className="text-xs">El chat está cerrado</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-slate-200 p-4 bg-white">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                          placeholder="Escribe un mensaje..."
                          className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200 placeholder-slate-400 transition-all"
                          disabled={sendingMessage}
                        />
                        <ITButton
                          variant="filled"
                          color="primary"
                          size="small"
                          onClick={handleSendMessage}
                          disabled={sendingMessage || !newMessage.trim()}
                        >
                          {sendingMessage ? <ITLoader size="sm" /> : <FaPaperPlane size={14} />}
                        </ITButton>
                      </div>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
          defaultActiveId="details"
          className="flex-1"
        />

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <ITButton variant="outlined" color="secondary" onClick={onClose}>
            Cerrar Ventana
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};

export default ComplaintDetailModal;