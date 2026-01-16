'use client';

import React, {  useRef } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button'; // Asumiendo que existe, si no usaré button normal
import { Loader2, Copy, Send, Download, X } from 'lucide-react'; // Iconos

// Tipos requeridos para mostrar la info
type TicketData = {
  id: string;
  socioNombre: string;
  planNombre: string;
  monto: number;
  fecha: Date;
  metodoPago: string;
  notas?: string | null;
  telefonoSocio?: string | null;
};

interface TicketReceiptProps {
  data: TicketData;
  onClose: () => void;
}

export default function TicketReceipt({ data, onClose }: TicketReceiptProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isCopying, setIsCopying] = React.useState(false);

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  const handleCopyToClipboard = async () => {
    if (!ticketRef.current) return;
    setIsCopying(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2, // Mejor calidad
        backgroundColor: '#ffffff',
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error("No se pudo generar el blob del ticket");
          return;
        }
        
        try {
          // Intentar usar la API de portapapeles moderna para imágenes
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          alert('¡Ticket copiado al portapapeles! Ahora pégalo en WhatsApp (Ctrl+V).');
        } catch (err) {
          console.error('Error al copiar al portapapeles:', err);
          // Fallback: Descargar la imagen si falla el portapapeles
          const link = document.createElement('a');
          link.download = `ticket-${data.id}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          alert('No se pudo copiar automáticamente. Se ha descargado la imagen.');
        }
      });

    } catch (error) {
      console.error('Error generando ticket:', error);
      alert('Hubo un error al generar la imagen del ticket.');
    } finally {
      setIsCopying(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!data.telefonoSocio) {
      alert("El socio no tiene número de teléfono registrado.");
      return;
    }

    // Limpiar el número de teléfono (quitar caracteres no numéricos)
    const cleanPhone = data.telefonoSocio.replace(/\D/g, '');
    
    // Asumimos código de país si no está presente (ej. +54 para Argentina)
    // Esto es opcional, depende de cómo guardes los teléfonos.
    // Si guardas sin 549, podrías necesitar agregarlo.
    // const finalPhone = cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`;
    const finalPhone = cleanPhone; // Usamos directo lo que venga por ahora

    const message = `Hola ${data.socioNombre}! 👋\n\nAdjunto te envío el comprobante de pago de tu suscripción *${data.planNombre}*.\n\nFecha: ${formatDate(data.fecha)}\nMonto: ${formatCurrency(data.monto)}\n\n¡Gracias por entrenar con nosotros! 💪`;

    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-all animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header del Modal */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h3 className="font-bold text-gray-700">Comprobante de Pago</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo Scrollable */}
        <div className="p-6 overflow-y-auto bg-gray-100 flex justify-center">
            {/* TICKET VISUAL - Este es el div que se convierte en imagen */}
            <div 
              ref={ticketRef} 
              className="w-[320px] bg-white p-6 shadow-sm border border-gray-200 text-center relative"
              style={{ fontFamily: 'monospace' }} // Look tipo ticket
            >
              {/* Decoración superior (Dientes de sierra o similar - simulado con css border) */}
              <div className="mb-4 pb-4 border-b-2 border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-900 rounded-full mx-auto flex items-center justify-center mb-2">
                   {/* Logo Placeholder - Podrías poner <img /> aquí */}
                   <span className="text-white font-bold text-xl">BC</span>
                </div>
                <h2 className="text-xl font-bold uppercase tracking-wider text-gray-800">Bendito Cross</h2>
                <p className="text-xs text-gray-500">Gimnasio & Fitness</p>
              </div>

              <div className="space-y-4 text-left">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Socio</p>
                  <p className="font-bold text-gray-800 text-lg truncate">{data.socioNombre}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <div>
                      <p className="text-xs text-gray-400 uppercase">Fecha</p>
                      <p className="text-sm font-medium">{new Date(data.fecha).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">{new Date(data.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase">Método</p>
                      <p className="text-sm font-medium uppercase">{data.metodoPago}</p>
                   </div>
                </div>

                <div className="py-2 border-t border-b border-gray-100 my-2">
                   <p className="text-xs text-gray-400 uppercase">Concepto</p>
                   <p className="font-bold text-gray-800">{data.planNombre}</p>
                   {data.notas && <p className="text-xs text-gray-500 italic mt-1">"{data.notas}"</p>}
                </div>

                <div className="pt-2 text-center">
                   <p className="text-xs text-gray-400 uppercase mb-1">Total Pagado</p>
                   <p className="text-3xl font-bold text-black">{formatCurrency(data.monto)}</p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-300">
                <p className="text-xs text-gray-400 mb-2">¡Gracias por tu pago!</p>
                <p className="text-[10px] text-gray-300">{data.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 border-t bg-gray-50 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
             <Button 
                onClick={handleOpenWhatsApp} 
                className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                disabled={!data.telefonoSocio}
                title={!data.telefonoSocio ? "El socio no tiene teléfono" : "Abrir WhatsApp"}
             >
                <Send className="w-4 h-4" /> 
                1. Abrir WhatsApp
             </Button>
             <Button 
                onClick={handleCopyToClipboard} 
                className="w-full flex items-center justify-center gap-2" 
                variant="outline"
                disabled={isCopying}
             >
                {isCopying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                2. Copiar Ticket
             </Button>
          </div>
          <p className="text-xs text-center text-gray-500">
             Pasos: Toca "Abrir WhatsApp" y luego pega (Ctrl+V) la imagen en el chat.
          </p>
        </div>
      </div>
    </div>
  );
}
