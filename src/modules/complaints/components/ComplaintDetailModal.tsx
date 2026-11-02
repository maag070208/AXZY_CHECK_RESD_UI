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
      await loadMessages();
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
      <div className="flex flex-col h-[680px] w-[640px] overflow-hidden bg-white">
        {/* Header minimalista */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              {complaint.category?.name && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1 h-1 rounded-full bg-gray-400" />
                  <ITText className="text-xs text-gray-400 font-medium">
                    {complaint.category.name}
                  </ITText>
                </div>
              )}
              <h4 className="text-xl font-semibold text-gray-900 leading-tight tracking-tight">
                {complaint.title}
              </h4>
            </div>
            <div className="flex-shrink-0">
              {getStatusBadge(complaint.status)}
            </div>
          </div>
        </div>

        <ITTabs
          items={[
            {
              id: "details",
              label: "Detalles",
              content: (
                <div className="px-6 py-5 space-y-5 overflow-y-auto h-full">
                  {/* Closed banner minimal */}
                  {complaint.status === "CLOSED" && (
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FaLock size={12} className="text-gray-400" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Queja Cerrada
                        </span>
                        <ITText className="text-xs text-gray-400 mt-0.5">
                          Esta queja está cerrada y no admite modificaciones
                        </ITText>
                      </div>
                    </div>
                  )}

                  {/* Progress stepper minimal */}
                  {complaint.status !== "CLOSED" && (
                    <div className="bg-white rounded-xl p-5 border border-gray-100">
                      <ITText className="text-[11px] font-semibold text-gray-400 mb-4 uppercase tracking-wider">
                        Progreso
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
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all"
                                  style={{
                                    backgroundColor: isPast ? primaryHex : isCurrent ? primaryHex : "#f1f5f9",
                                    color: isPast || isCurrent ? "#fff" : "#94a3b8",
                                    boxShadow: isCurrent ? `0 0 0 2px ${primaryHex}20` : "none",
                                  }}
                                >
                                  {isPast ? <FaCheck size={10} /> : i + 1}
                                </div>
                                <span
                                  className="text-[10px] font-medium mt-2 text-center whitespace-nowrap"
                                  style={{
                                    color: isPast || isCurrent ? primaryHex : "#94a3b8",
                                  }}
                                >
                                  {STATUS_LABELS[s]}
                                </span>
                              </div>
                              {i < arr.length - 1 && (
                                <div
                                  className="flex-1 h-0.5 mt-3 -ml-1 mr-1"
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

                  {/* Description card minimal */}
                  <div className="space-y-2">
                    <ITText className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Descripción
                    </ITText>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <ITText className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                        {complaint.description}
                      </ITText>
                    </div>
                  </div>

                  {/* Info grid minimal */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-gray-100 rounded-xl p-3">
                      <ITText className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Registro
                      </ITText>
                      <ITText className="text-gray-700 font-medium text-sm">
                        {dayjs(complaint.createdAt).format("DD/MM/YYYY HH:mm")}
                      </ITText>
                    </div>

                    {!isResident && complaint.resident?.user && (
                      <div className="bg-white border border-gray-100 rounded-xl p-3">
                        <ITText className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                          Reportado por
                        </ITText>
                        <ITText className="text-gray-700 font-medium text-sm truncate">
                          {complaint.resident.user.name} {complaint.resident.user.lastName || ""}
                        </ITText>
                      </div>
                    )}
                  </div>

                  {/* Resolution card minimal */}
                  {complaint.resolvedBy && (
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryHex}10` }}>
                            <FaCheck size={10} style={{ color: primaryHex }} />
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              Resuelto por
                            </span>
                            <ITText className="text-gray-700 font-medium text-sm mt-0.5">
                              {complaint.resolvedBy.name} {complaint.resolvedBy.lastName || ""}
                            </ITText>
                          </div>
                        </div>
                        {complaint.resolvedAt && (
                          <div className="text-right">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              Fecha
                            </span>
                            <ITText className="text-gray-700 font-medium text-sm mt-0.5">
                              {dayjs(complaint.resolvedAt).format("DD/MM/YYYY")}
                            </ITText>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Admin actions minimal */}
                  {isAdmin && complaint.status !== "CLOSED" && (
                    <div className="border-t border-gray-100 pt-5 mt-2">
                      <ITText className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Acciones
                      </ITText>
                      <div className="flex flex-wrap gap-2">
                        {getAvailableTransitions(complaint.status).map((nextStatus) => {
                          const isInProgress = nextStatus === "IN_PROGRESS";
                          const isResolved = nextStatus === "RESOLVED";
                          const isClosed = nextStatus === "CLOSED";
                          
                          return (
                            <ITButton
                              key={nextStatus}
                              variant={isInProgress ? "outlined" : "filled"}
                              color={
                                isInProgress ? "warning" : isResolved ? "success" : "secondary"
                              }
                              onClick={() => onUpdateStatus(nextStatus)}
                              disabled={isUpdatingStatus}
                              size="small"
                            >
                              <div className="flex items-center gap-1.5">
                                {isResolved && <FaCheck size={11} />}
                                {isClosed && <FaLock size={11} />}
                                <span>
                                  {isInProgress ? "En Progreso" : isResolved ? "Resolver" : "Cerrar"}
                                </span>
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
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
                    {loadingMessages ? (
                      <div className="flex justify-center py-12">
                        <ITLoader size="sm" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <FaComment size={20} className="text-gray-300" />
                        </div>
                        <ITText className="text-sm text-gray-400">
                          No hay mensajes aún
                        </ITText>
                        <ITText className="text-xs text-gray-300 mt-1">
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
                                <ITText className="text-[11px] font-medium text-gray-500 mb-1 ml-1">
                                  {msg.user?.name}
                                </ITText>
                              )}
                              <div
                                className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                                  isMine
                                    ? "text-white rounded-2xl rounded-br-md shadow-sm"
                                    : "bg-white border border-gray-100 rounded-2xl rounded-bl-md text-gray-700 shadow-sm"
                                }`}
                                style={isMine ? { backgroundColor: primaryHex } : undefined}
                              >
                                {msg.message}
                              </div>
                              <ITText className="text-[10px] text-gray-400 mt-1 block text-right">
                                {dayjs(msg.createdAt).format("HH:mm")}
                              </ITText>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input area minimal */}
                  {complaint.status === "CLOSED" ? (
                    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                      <div className="flex items-center gap-2 text-gray-400">
                        <FaLock size={12} />
                        <span className="text-xs">Chat cerrado</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-gray-100 p-4 bg-white">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                          placeholder="Escribe un mensaje..."
                          className="flex-1 text-sm px-4 py-2.5 rounded-xl bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-400 transition-all"
                          disabled={sendingMessage}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={sendingMessage || !newMessage.trim()}
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: !newMessage.trim() ? "#e2e8f0" : primaryHex,
                            cursor: !newMessage.trim() ? "not-allowed" : "pointer",
                          }}
                        >
                          {sendingMessage ? (
                            <ITLoader size="sm" />
                          ) : (
                            <FaPaperPlane size={14} color={!newMessage.trim() ? "#94a3b8" : "#fff"} />
                          )}
                        </button>
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

        {/* Footer minimal */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </ITDialog>
  );
};

export default ComplaintDetailModal;