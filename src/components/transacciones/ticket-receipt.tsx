'use client';

import React, {  useRef } from 'react';
import html2canvas from 'html2canvas';
import { 
  ArrowPathIcon, 
  ClipboardDocumentIcon, 
  PaperAirplaneIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

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
      // Generar canvas
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      // Convertir a Blob (Promisificado para mejor control de errores)
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/png')
      );

      if (!blob) throw new Error("Falló la conversión a imagen");

      try {
        // Intentar copiar al portapapeles
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        alert('¡Ticket copiado al portapapeles! 📋\n\nVe a WhatsApp y presiona Ctrl + V (Pegar).');
      } catch (clipboardError) {
        console.warn('Falló el portapapeles, usando descarga como fallback:', clipboardError);
        // PLAN B: Descargar la imagen si falla el portapapeles
        const link = document.createElement('a');
        link.download = `comprobante-${data.socioNombre.replace(/\s+/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('No se pudo copiar automáticamente (el navegador lo bloqueó).\n\n📥 Se ha descargado la imagen en tu dispositivo.');
      }

    } catch (error: any) {
      console.error('Error generando ticket:', error);
      alert(`Error técnico: ${error?.message || 'Error desconocido'}. \n\nPor favor intenta tomar una foto manual.`);
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
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo Scrollable */}
        <div className="p-6 overflow-y-auto bg-gray-100 flex justify-center">
            {/* TICKET VISUAL - Este es el div que se convierte en imagen 
                IMPORTANTE: Usamos estilos inline con códigos HEX para asegurar
                que html2canvas pueda leer los colores correctamente, ya que
                a veces falla con las variables CSS modernas de Tailwind.
            */}
            <div 
              ref={ticketRef} 
              className="w-[320px] p-6 shadow-sm border text-center relative"
              style={{ 
                fontFamily: 'monospace',
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb',
                color: '#1f2937'
              }}
            >
              {/* Decoración superior */}
              <div className="mb-4 pb-4 border-b-2 border-dashed" style={{ borderColor: '#d1d5db' }}>
                <div 
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-2"
                  style={{ backgroundColor: '#111827' }}
                >
                   <span className="font-bold text-xl" style={{ color: '#ffffff' }}>BC</span>
                </div>
                <h2 className="text-xl font-bold uppercase tracking-wider" style={{ color: '#1f2937' }}>Bendito Cross</h2>
                <p className="text-xs" style={{ color: '#6b7280' }}>Gimnasio & Fitness</p>
              </div>

              <div className="space-y-4 text-left">
                <div>
                  <p className="text-xs uppercase" style={{ color: '#9ca3af' }}>Socio</p>
                  <p className="font-bold text-lg truncate" style={{ color: '#1f2937' }}>{data.socioNombre}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <div>
                      <p className="text-xs uppercase" style={{ color: '#9ca3af' }}>Fecha</p>
                      <p className="text-sm font-medium" style={{ color: '#1f2937' }}>{new Date(data.fecha).toLocaleDateString()}</p>
                      <p className="text-xs" style={{ color: '#9ca3af' }}>{new Date(data.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs uppercase" style={{ color: '#9ca3af' }}>Método</p>
                      <p className="text-sm font-medium uppercase" style={{ color: '#1f2937' }}>{data.metodoPago}</p>
                   </div>
                </div>

                <div className="py-2 border-t border-b my-2" style={{ borderColor: '#f3f4f6' }}>
                   <p className="text-xs uppercase" style={{ color: '#9ca3af' }}>Concepto</p>
                   <p className="font-bold" style={{ color: '#1f2937' }}>{data.planNombre}</p>
                   {data.notas && <p className="text-xs italic mt-1" style={{ color: '#6b7280' }}>"{data.notas}"</p>}
                </div>

                <div className="pt-2 text-center">
                   <p className="text-xs uppercase mb-1" style={{ color: '#9ca3af' }}>Total Pagado</p>
                   <p className="text-3xl font-bold" style={{ color: '#000000' }}>{formatCurrency(data.monto)}</p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t-2 border-dashed" style={{ borderColor: '#d1d5db' }}>
                <p className="text-xs mb-2" style={{ color: '#9ca3af' }}>¡Gracias por tu pago!</p>
                <p className="text-[10px]" style={{ color: '#d1d5db' }}>{data.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 border-t bg-gray-50 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={handleOpenWhatsApp} 
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!data.telefonoSocio}
                title={!data.telefonoSocio ? "El socio no tiene teléfono" : "Abrir WhatsApp"}
             >
                <PaperAirplaneIcon className="w-4 h-4 -rotate-45" /> 
                1. WhatsApp
             </button>
             <button 
                onClick={handleCopyToClipboard} 
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer disabled:opacity-50" 
                disabled={isCopying}
             >
                {isCopying ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                2. Copiar
             </button>
          </div>
          <p className="text-xs text-center text-gray-500">
             Pasos: Toca "Abrir WhatsApp" y luego pega (Ctrl+V) la imagen en el chat.
          </p>
        </div>
      </div>
    </div>
  );
}
