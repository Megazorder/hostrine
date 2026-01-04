import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Download, Trash2, Search, Plus, MoreHorizontal, Phone, Mail, Calendar, MapPin, X, Banknote, Wallet, Home, Clock, Info, UserPlus, FileText, UploadCloud, User, Briefcase, ScrollText, CheckCircle2, Save, FileCheck, Paperclip, Eye, CheckSquare, Square, ChevronDown, ChevronRight, AlertCircle, PieChart, Link as LinkIcon, Share2, Camera, ExternalLink, Archive, FolderArchive, Loader2 } from 'lucide-react';
import { storageService } from '../services/storage';
import { Lead, LeadColumn, LeadScore, Property, LeadDocument, ChecklistItemState, IncomeType } from '../types';
import JSZip from 'jszip';

export const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [columns, setColumns] = useState<LeadColumn[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  
  // Column Management
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  // Manual Lead Entry (Basic)
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    whatsapp: '',
    email: '',
    propertyId: ''
  });

  // Detailed Edit Modal
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'financial' | 'docs'>('profile');
  
  // File Upload Handling
  const fileInputRef = useRef<HTMLInputElement>(null); // For general uploads
  const checklistFileInputRef = useRef<HTMLInputElement>(null); // For specific checklist items
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  // Document Preview State (Lightbox)
  const [previewDoc, setPreviewDoc] = useState<{url: string, type: 'image' | 'pdf', title: string} | null>(null);

  // Zip Export State
  const [isExportingZip, setIsExportingZip] = useState(false);

  useEffect(() => {
    setLeads(storageService.getLeads());
    setColumns(storageService.getLeadColumns());
    setProperties(storageService.getProperties());
  }, []);

  // --- Image Compression Helper ---
  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      // If not an image, return simple base64
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024; // Resize to max 1024px width for optimization
          const scaleSize = MAX_WIDTH / img.width;
          
          // Only resize if bigger than max
          if (img.width > MAX_WIDTH) {
             canvas.width = MAX_WIDTH;
             canvas.height = img.height * scaleSize;
          } else {
             canvas.width = img.width;
             canvas.height = img.height;
          }
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Compress to JPEG 0.7 quality
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  // --- Helper Functions ---

  const getPropertyPrice = (propertyId: string) => {
    const prop = properties.find(p => p.id === propertyId);
    return prop ? prop.price : 0;
  };

  const calculateLeadScore = (price: number, income: number, downPayment: number, fgts: number): LeadScore => {
    const totalEntry = downPayment + fgts;
    const entryRule = totalEntry >= (price * 0.2);
    
    // Simulate financing logic
    const financedAmount = price - totalEntry;
    if (financedAmount <= 0) return 'gold';

    const annualRate = 0.10;
    const monthlyRate = annualRate / 12;
    const months = 360;
    
    const amortization = financedAmount / months;
    const interest = financedAmount * monthlyRate;
    const firstInstallment = amortization + interest;
    
    const maxInstallment = income * 0.3;
    const installmentRule = firstInstallment <= maxInstallment;

    if (entryRule && installmentRule) return 'gold';
    if (!entryRule && installmentRule) return 'silver';
    
    return 'curious';
  };

  // --- Checklist Logic ---

  const CHECKLIST_STRUCTURE = useMemo(() => {
    return [
      {
        id: 'personal',
        title: 'Documentos Pessoais (Comprador)',
        icon: User,
        items: [
          { id: 'doc_personal_id', label: 'RG/CPF ou CNH' },
          { id: 'doc_personal_status', label: 'Certidão de Nascimento ou Casamento' },
          { id: 'doc_personal_address', label: 'Comprovante de Residência' },
          { id: 'doc_personal_ir', label: 'Declaração de Imposto de Renda + Recibo' },
        ]
      },
      {
        id: 'income',
        title: 'Comprovação de Renda',
        icon: Banknote,
        dynamic: true // Items depend on IncomeType
      },
      {
        id: 'fgts',
        title: 'Uso do FGTS (Opcional)',
        icon: Wallet,
        items: [
          { id: 'doc_fgts_extract', label: 'Extrato Vinculado do FGTS' },
          { id: 'doc_fgts_ctps', label: 'Cópia da Carteira de Trabalho (CTPS)' },
        ]
      },
      {
        id: 'property',
        title: 'Imóvel e Vendedor (Segurança)',
        icon: Home,
        items: [
          { id: 'doc_prop_matricula', label: 'Matrícula Atualizada' },
          { id: 'doc_prop_iptu', label: 'Capa do IPTU' },
        ]
      }
    ];
  }, []);

  const getIncomeItems = (type?: IncomeType) => {
    switch (type) {
      case 'CLT':
        return [{ id: 'doc_inc_holerites', label: '3 Últimos Holerites' }];
      case 'Empresario':
        return [
          { id: 'doc_inc_social', label: 'Contrato Social / Certificado MEI' },
          { id: 'doc_inc_bank_pj', label: 'Extratos Bancários PJ (6 meses)' },
          { id: 'doc_inc_bank_pf', label: 'Extratos Bancários PF (6 meses)' }
        ];
      case 'Autonomo':
        return [
          { id: 'doc_inc_bank_pf', label: 'Extratos Bancários PF (6 meses)' },
          { id: 'doc_inc_decore', label: 'DECORE' }
        ];
      default:
        return [];
    }
  };

  const getVisibleChecklistItems = (lead: Lead) => {
    let items: {id: string, label: string}[] = [];
    CHECKLIST_STRUCTURE.forEach(cat => {
      if (cat.id === 'income') {
        items = [...items, ...getIncomeItems(lead.incomeType)];
      } else if (cat.items) {
        items = [...items, ...cat.items];
      }
    });
    return items;
  };

  const calculateProgress = (lead: Lead) => {
    const visibleItems = getVisibleChecklistItems(lead);
    if (visibleItems.length === 0) return 0;
    
    const checkedCount = visibleItems.reduce((acc, item) => {
      return acc + (lead.checklist?.[item.id]?.checked ? 1 : 0);
    }, 0);
    
    return Math.round((checkedCount / visibleItems.length) * 100);
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!editingLead) return;
    
    const currentStatus = editingLead.checklist?.[itemId] || { checked: false };
    const newStatus = { ...currentStatus, checked: !currentStatus.checked };
    
    setEditingLead({
      ...editingLead,
      checklist: {
        ...editingLead.checklist,
        [itemId]: newStatus
      }
    });
  };

  const triggerChecklistUpload = (itemId: string) => {
    setUploadingItemId(itemId);
    checklistFileInputRef.current?.click();
  };

  const handleChecklistUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editingLead && uploadingItemId) {
      const file = e.target.files[0];
      
      // Use compression
      const compressedDataUrl = await compressImage(file);

      const newItemState: ChecklistItemState = {
        checked: true, // Auto check on upload
        fileUrl: compressedDataUrl,
        fileName: file.name,
        uploadedAt: Date.now()
      };
      
      setEditingLead({
        ...editingLead,
        checklist: {
          ...editingLead.checklist,
          [uploadingItemId]: newItemState
        }
      });
    }
    // Reset
    if (checklistFileInputRef.current) checklistFileInputRef.current.value = '';
    setUploadingItemId(null);
  };

  const handleDeleteDoc = (itemId: string) => {
    if (!editingLead || !window.confirm("Tem certeza que deseja excluir este documento?")) return;

    // Create a copy of the checklist
    const updatedChecklist = { ...editingLead.checklist };
    
    // Set to unchecked/empty state
    updatedChecklist[itemId] = { checked: false };

    setEditingLead({
        ...editingLead,
        checklist: updatedChecklist
    });
  };

  const handleDownloadDoc = (url: string, originalName: string, docLabel: string, clientName: string) => {
    const ext = originalName.split('.').pop() || 'jpg';
    
    // Sanitize names for filename
    const safeClient = clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeDoc = docLabel.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
    
    const fileName = `${safeDoc}_${safeClient}.${ext}`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportZip = async () => {
    if (!editingLead) return;

    const visibleItems = getVisibleChecklistItems(editingLead);
    const filesToZip: { label: string, url: string, originalName: string }[] = [];

    // Collect valid files
    visibleItems.forEach(item => {
        const checkItem = editingLead.checklist?.[item.id];
        if (checkItem && checkItem.checked && checkItem.fileUrl) {
            filesToZip.push({
                label: item.label,
                url: checkItem.fileUrl,
                originalName: checkItem.fileName || 'document'
            });
        }
    });

    if (filesToZip.length === 0) {
        alert("Nenhum documento encontrado para exportação.");
        return;
    }

    setIsExportingZip(true);

    try {
        const zip = new JSZip();
        const folderName = `Documentos_${editingLead.name.replace(/[^a-z0-9]/gi, '_')}`;
        const folder = zip.folder(folderName);

        if (folder) {
            // Process files
            await Promise.all(filesToZip.map(async (file, index) => {
                // Fetch blob from URL (works for Data URI and Remote URL)
                const response = await fetch(file.url);
                const blob = await response.blob();
                
                const ext = file.originalName.split('.').pop() || 'jpg';
                const safeLabel = file.label.replace(/[^a-z0-9]/gi, '_').substring(0, 40);
                const safeClient = editingLead.name.split(' ')[0].replace(/[^a-z0-9]/gi, '');
                
                // Naming: 01_RG_CPF_Roberto.jpg
                const fileName = `${(index + 1).toString().padStart(2, '0')}_${safeLabel}_${safeClient}.${ext}`;
                
                folder.file(fileName, blob);
            }));

            // Generate ZIP
            const content = await zip.generateAsync({ type: "blob" });
            
            // Trigger Download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${folderName}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Notify success (optional, or just rely on download start)
            // alert("Download iniciado!"); 
        }
    } catch (error) {
        console.error("Erro ao gerar ZIP:", error);
        alert("Ocorreu um erro ao compactar os arquivos. Tente novamente.");
    } finally {
        setIsExportingZip(false);
    }
  };

  const handleOpenPreview = (url: string, label: string) => {
      // Basic check for PDF vs Image based on data URL signature or extension if available
      const isPdf = url.startsWith('data:application/pdf') || url.includes('.pdf');
      setPreviewDoc({
          url,
          type: isPdf ? 'pdf' : 'image',
          title: label
      });
  };

  // --- External Link Logic ---
  const generateDocLink = (leadId: string) => {
    // Robust link generation: Origin + Path + Hash
    const url = new URL(window.location.href);
    const baseUrl = `${url.origin}${url.pathname}`;
    return `${baseUrl}#/upload/${leadId}`;
  };

  const copyDocLink = (leadId: string) => {
    const link = generateDocLink(leadId);
    navigator.clipboard.writeText(link);
    alert("Link copiado para a área de transferência!");
  };

  const sendDocLinkWhatsapp = (lead: Lead) => {
    const link = generateDocLink(lead.id);
    const firstName = lead.name.split(' ')[0];
    const message = `Olá ${firstName}, aqui está o link seguro para você enviar as fotos dos documentos para o seu financiamento. Basta clicar e anexar: ${link}`;
    window.open(`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openEditModal = (lead: Lead) => {
    // Clear the notification flag when opening
    if (lead.hasNewUploads) {
       const updated = { ...lead, hasNewUploads: false };
       storageService.updateLead(updated);
       setLeads(storageService.getLeads()); // Refresh list
       setEditingLead(updated);
    } else {
       setEditingLead(lead);
    }
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColumnId(colId);
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);
    
    if (draggedLeadId) {
      storageService.updateLeadStatus(draggedLeadId, colId);
      setLeads(storageService.getLeads());
      setDraggedLeadId(null);
    }
  };

  // --- CRUD Operations ---

  const handleAddColumnClick = () => {
    setShowAddColumnModal(true);
    setNewColumnTitle('');
  };

  const confirmAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColumnTitle.trim()) {
      const newCol: LeadColumn = {
        id: Math.random().toString(36).substr(2, 9),
        title: newColumnTitle.trim(),
        color: '#64748b',
        order: columns.length
      };
      const updated = [...columns, newCol];
      storageService.saveLeadColumns(updated);
      setColumns(updated);
      setShowAddColumnModal(false);
      setNewColumnTitle('');
    }
  };

  const handleDeleteColumn = (colId: string) => {
    const hasLeads = leads.some(l => l.status === colId);
    if (hasLeads) {
      alert("Não é possível excluir uma coluna que contém leads. Mova-os primeiro.");
      return;
    }
    
    if (window.confirm("Excluir esta coluna?")) {
      const updated = columns.filter(c => c.id !== colId);
      storageService.saveLeadColumns(updated);
      setColumns(updated);
    }
  };

  const handleRenameColumn = (colId: string, currentTitle: string) => {
    const newTitle = prompt("Novo nome da coluna:", currentTitle);
    if (newTitle && newTitle !== currentTitle) {
      const updated = columns.map(c => c.id === colId ? { ...c, title: newTitle } : c);
      storageService.saveLeadColumns(updated);
      setColumns(updated);
    }
  };

  const handleDeleteLead = (id: string) => {
    if (window.confirm('Excluir este lead permanentemente?')) {
      storageService.deleteLead(id);
      setLeads(storageService.getLeads());
      if (editingLead && editingLead.id === id) setEditingLead(null);
    }
  };

  const handleSaveNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.propertyId) {
      alert("Nome e Imóvel são obrigatórios");
      return;
    }

    const selectedProperty = properties.find(p => p.id === newLeadForm.propertyId);
    const defaultStatus = columns.length > 0 ? columns[0].id : 'new';

    const newLead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      name: newLeadForm.name,
      whatsapp: newLeadForm.whatsapp,
      email: newLeadForm.email,
      propertyId: newLeadForm.propertyId,
      propertyTitle: selectedProperty ? selectedProperty.title : 'Desconhecido',
      createdAt: Date.now(),
      status: defaultStatus,
      score: 'unscored',
      income: 0,
      downPayment: 0,
      fgts: 0,
      documents: [],
      incomeType: 'CLT',
      checklist: {}
    };

    storageService.saveLead(newLead);
    setLeads(storageService.getLeads());
    setShowAddLeadModal(false);
    setNewLeadForm({ name: '', whatsapp: '', email: '', propertyId: '' });
  };

  const handleUpdateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead) {
      const propertyPrice = getPropertyPrice(editingLead.propertyId);
      const newScore = calculateLeadScore(
        propertyPrice, 
        editingLead.income || 0, 
        editingLead.downPayment || 0, 
        editingLead.fgts || 0
      );

      const updatedLead = { ...editingLead, score: newScore };
      storageService.updateLead(updatedLead);
      setLeads(storageService.getLeads());
      setEditingLead(null);
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'Nome', 'WhatsApp', 'Email', 'Imóvel', 'Renda', 'Entrada', 'FGTS', 'Score', 'Status', 'Data'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        lead.id,
        `"${lead.name}"`,
        lead.whatsapp,
        lead.email,
        `"${lead.propertyTitle}"`,
        lead.income || 0,
        lead.downPayment || 0,
        lead.fgts || 0,
        lead.score || 'unscored',
        lead.status,
        new Date(lead.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getColumnLeads = (colId: string) => {
    return leads.filter(lead => {
      const matchesSearch = searchTerm === '' || 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase());
      return lead.status === colId && matchesSearch;
    }).sort((a, b) => b.createdAt - a.createdAt);
  };

  // --- UI Components ---

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Há ${days} dia${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Há ${minutes} min`;
    return 'Agora';
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return 'R$ 0,00';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  const LeadBadge = ({ score }: { score?: LeadScore }) => {
    if (!score || score === 'unscored') return null;
    
    let styleClass = '';
    let label = '';
    let description = '';
    
    if (score === 'gold') {
      styleClass = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20';
      label = 'OURO';
      description = 'Alta probabilidade. Entrada e renda compatíveis.';
    } else if (score === 'silver') {
      styleClass = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
      label = 'PRATA';
      description = 'Médio potencial. Renda boa, mas entrada ajustada.';
    } else if (score === 'curious') {
      styleClass = 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      label = 'CURIOSO';
      description = 'Baixo potencial. Entrada ou renda insuficientes.';
    } else {
      return null;
    }

    return (
      <div className={`text-[11px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider flex items-center gap-1.5 ${styleClass} relative group cursor-help`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {label}
        <div className="absolute bottom-full left-0 mb-2 w-48 p-2.5 bg-gray-900 dark:bg-gray-800 text-white text-[10px] font-medium normal-case rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none border border-gray-700">
           {description}
           <div className="absolute top-full left-4 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
        </div>
      </div>
    );
  };

  // Styles
  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-colors text-sm";
  const labelClass = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide";

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-fadeIn relative font-sans">
      {/* ... Header & Kanban Board ... (Same as before, simplified for XML brevity) */}
      <div className="flex flex-col gap-5 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM & Análise de Crédito</h1>
            <p className="text-gray-500 dark:text-gray-400">Pipeline de vendas com qualificação financeira automática dos leads.</p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar leads..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            <button 
              onClick={handleExport}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Exportar CSV"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={() => setShowAddLeadModal(true)}
              className="bg-white dark:bg-gray-800 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 px-4 py-2 rounded-lg font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors flex items-center gap-2"
            >
              <UserPlus size={18} />
              Novo Lead
            </button>
            <button 
              onClick={handleAddColumnClick}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Nova Fase
            </button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 flex items-start gap-3">
          <Info className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-blue-800 dark:text-blue-300 leading-snug">
            <strong>Origem dos Dados:</strong> As informações financeiras (Renda, Entrada, FGTS) exibidas nos cards foram preenchidas diretamente pelo cliente no formulário de desbloqueio de preço na vitrine. A classificação (Ouro/Prata/Curioso) é calculada automaticamente pelo sistema.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full min-w-max px-2">
          {columns.map((column) => {
            const colLeads = getColumnLeads(column.id);
            return (
              <div 
                key={column.id}
                className={`
                   w-[320px] sm:w-[380px] flex flex-col rounded-2xl transition-all duration-200 border-2 h-full
                   ${dragOverColumnId === column.id 
                     ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-500/50' 
                     : 'bg-gray-100/50 dark:bg-gray-900/20 border-transparent'}
                `}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="p-4 flex justify-between items-center mb-2">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: column.color }}></div>
                      <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide cursor-pointer hover:text-brand-500" onClick={() => handleRenameColumn(column.id, column.title)}>
                        {column.title}
                      </h3>
                      <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        {colLeads.length}
                      </span>
                   </div>
                   <div className="group relative">
                      <MoreHorizontal size={20} className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-200" />
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 hidden group-hover:block z-20 overflow-hidden">
                         <button onClick={() => handleRenameColumn(column.id, column.title)} className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Renomear</button>
                         <button onClick={() => handleDeleteColumn(column.id)} className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">Excluir</button>
                      </div>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-5 custom-scrollbar">
                   {colLeads.map((lead) => (
                     <div 
                       key={lead.id}
                       draggable
                       onDragStart={(e) => handleDragStart(e, lead.id)}
                       onClick={() => openEditModal(lead)}
                       className={`
                         bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 
                         cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-all duration-200 group relative
                         flex flex-col gap-5
                         ${draggedLeadId === lead.id ? 'opacity-40' : 'opacity-100'}
                       `}
                     >
                        <div className="flex justify-between items-start">
                           <LeadBadge score={lead.score} />
                           
                           {/* NOTIFICATION ICON */}
                           {lead.hasNewUploads && (
                              <div className="absolute top-6 right-10 animate-bounce">
                                 <Paperclip size={18} className="text-red-500" />
                                 <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                              </div>
                           )}

                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}
                             className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                        <div className="flex items-center gap-3.5">
                           <div className="w-[52px] h-[52px] bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold text-xl border border-slate-200 dark:border-slate-600">
                             {getInitials(lead.name)}
                           </div>
                           <div>
                             <h4 className="font-bold text-xl text-gray-900 dark:text-slate-50 leading-tight">{lead.name}</h4>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ID: #{lead.id.substring(0,4)}</p>
                           </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-950 rounded-xl p-5 border border-gray-200 dark:border-slate-700 flex flex-col gap-4">
                           <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0 border border-green-200/50 dark:border-green-500/20 text-green-500 shadow-sm">
                                <Banknote size={24} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold uppercase text-gray-500 dark:text-slate-400 tracking-wide">Renda Mensal</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency(lead.income)}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0 border border-yellow-200/50 dark:border-yellow-500/20 text-yellow-500 shadow-sm">
                                <Wallet size={24} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold uppercase text-gray-500 dark:text-slate-400 tracking-wide">Entrada Disponível</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency((lead.downPayment || 0) + (lead.fgts || 0))}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-2xl flex-shrink-0 border border-purple-200/50 dark:border-purple-500/20 text-purple-500 shadow-sm">
                                <Home size={24} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold uppercase text-gray-500 dark:text-slate-400 tracking-wide">Valor do Imóvel</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency(getPropertyPrice(lead.propertyId))}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-3 mt-1">
                           <a 
                             href={`https://wa.me/${lead.whatsapp.replace(/\D/g,'')}`} 
                             target="_blank" 
                             rel="noreferrer"
                             onMouseDown={(e) => e.stopPropagation()}
                             className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 font-semibold text-sm border border-green-500/20 transition-colors shadow-sm"
                           >
                             <Phone size={18} />
                             WhatsApp
                           </a>
                           <a 
                             href={`mailto:${lead.email}`}
                             onMouseDown={(e) => e.stopPropagation()}
                             className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-200 font-semibold text-sm border border-slate-600 transition-colors shadow-sm"
                           >
                             <Mail size={18} />
                             E-mail
                           </a>
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center text-xs">
                           <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold max-w-[65%]">
                              <MapPin size={14} />
                              <span className="truncate" title={lead.propertyTitle}>{lead.propertyTitle}</span>
                           </div>
                           <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500">
                              <Clock size={14} />
                              <span>{getTimeAgo(lead.createdAt)}</span>
                           </div>
                        </div>
                     </div>
                   ))}
                   {colLeads.length === 0 && (
                     <div className="h-32 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-2">
                       <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                          <Search size={20} className="opacity-50" />
                       </div>
                       <span className="text-sm font-medium">Vazio</span>
                     </div>
                   )}
                </div>
              </div>
            );
          })}
          <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center mt-2">
             <button 
               onClick={handleAddColumnClick}
               className="w-full h-full bg-white dark:bg-slate-800 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500 hover:text-brand-500 dark:hover:text-brand-400 flex items-center justify-center transition-all shadow-md border border-gray-200 dark:border-slate-700"
               title="Nova Fase"
             >
               <Plus size={24} />
             </button>
          </div>
        </div>
      </div>
      
      {/* ... Add Column and Add Lead Modals (Same as before) ... */}
      {showAddColumnModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 animate-fadeIn">
               <div className="flex justify-between items-center mb-5">
                 <h3 className="font-bold text-lg text-gray-900 dark:text-white">Nova Fase</h3>
                 <button onClick={() => setShowAddColumnModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X size={20} /></button>
               </div>
               <form onSubmit={confirmAddColumn}>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Ex: Em Negociação"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-5 transition-colors"
                  />
                  <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setShowAddColumnModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancelar</button>
                     <button type="submit" disabled={!newColumnTitle.trim()} className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 shadow-md transition-colors">Adicionar</button>
                  </div>
               </form>
           </div>
        </div>
      )}

      {showAddLeadModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md animate-fadeIn">
               <div className="flex justify-between items-center mb-5">
                 <h3 className="font-bold text-lg text-gray-900 dark:text-white">Cadastrar Novo Lead</h3>
                 <button onClick={() => setShowAddLeadModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X size={20} /></button>
               </div>
               <form onSubmit={handleSaveNewLead} className="space-y-4">
                  <div>
                    <label className={labelClass}>Nome</label>
                    <input 
                      autoFocus
                      type="text" 
                      required
                      value={newLeadForm.name}
                      onChange={(e) => setNewLeadForm({...newLeadForm, name: e.target.value})}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>WhatsApp</label>
                    <input 
                      type="tel" 
                      value={newLeadForm.whatsapp}
                      onChange={(e) => setNewLeadForm({...newLeadForm, whatsapp: e.target.value})}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>E-mail</label>
                    <input 
                      type="email" 
                      value={newLeadForm.email}
                      onChange={(e) => setNewLeadForm({...newLeadForm, email: e.target.value})}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Imóvel de Interesse</label>
                    <select
                      required
                      value={newLeadForm.propertyId}
                      onChange={(e) => setNewLeadForm({...newLeadForm, propertyId: e.target.value})}
                      className={inputClass}
                    >
                      <option value="">Selecione um imóvel...</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                     <button type="button" onClick={() => setShowAddLeadModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancelar</button>
                     <button type="submit" className="px-6 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-md transition-colors">Salvar Lead</button>
                  </div>
               </form>
           </div>
        </div>
      )}

      {/* Detailed Lead Edit Modal (Tabs + Docs) */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
           <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
               
               {/* Modal Header */}
               <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start bg-gray-50 dark:bg-slate-950/50">
                 <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                       {editingLead.name}
                       <LeadBadge score={editingLead.score} />
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: #{editingLead.id} • Criado {getTimeAgo(editingLead.createdAt)}</p>
                 </div>
                 <button onClick={() => setEditingLead(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors">
                    <X size={24} />
                 </button>
               </div>

               {/* Tabs Navigation */}
               <div className="flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 pt-2">
                 <button 
                   onClick={() => setActiveTab('profile')}
                   className={`pb-3 px-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                 >
                   <User size={18} /> Perfil e Contato
                 </button>
                 <button 
                   onClick={() => setActiveTab('financial')}
                   className={`pb-3 px-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'financial' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                 >
                   <Banknote size={18} /> Análise Financeira
                 </button>
                 <button 
                   onClick={() => setActiveTab('docs')}
                   className={`pb-3 px-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'docs' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                 >
                   <FileText size={18} /> Documentação
                 </button>
               </div>

               {/* Modal Content - Scrollable */}
               <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 dark:bg-slate-900/50">
                 <form id="edit-lead-form" onSubmit={handleUpdateLead} className="max-w-3xl mx-auto space-y-6">
                    
                    {/* TAB: PROFILE */}
                    {activeTab === 'profile' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        <div className="md:col-span-2">
                          <label className={labelClass}>Nome Completo</label>
                          <input type="text" value={editingLead.name} onChange={e => setEditingLead({...editingLead, name: e.target.value})} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}><Phone size={14} className="inline mr-1" /> WhatsApp</label>
                          <input type="text" value={editingLead.whatsapp} onChange={e => setEditingLead({...editingLead, whatsapp: e.target.value})} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}><Mail size={14} className="inline mr-1" /> E-mail</label>
                          <input type="text" value={editingLead.email} onChange={e => setEditingLead({...editingLead, email: e.target.value})} className={inputClass} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelClass}><MapPin size={14} className="inline mr-1" /> Endereço Atual</label>
                          <input type="text" value={editingLead.address || ''} onChange={e => setEditingLead({...editingLead, address: e.target.value})} className={inputClass} placeholder="Rua, Número, Bairro, Cidade - UF" />
                        </div>
                      </div>
                    )}

                    {/* TAB: FINANCIAL */}
                    {activeTab === 'financial' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                         <div>
                            <label className={labelClass}><Banknote size={14} className="inline mr-1" /> Renda Familiar Mensal (R$)</label>
                            <input type="number" value={editingLead.income} onChange={e => setEditingLead({...editingLead, income: Number(e.target.value)})} className={inputClass} />
                         </div>
                         <div>
                            <label className={labelClass}><Wallet size={14} className="inline mr-1" /> Entrada Disponível (R$)</label>
                            <input type="number" value={editingLead.downPayment} onChange={e => setEditingLead({...editingLead, downPayment: Number(e.target.value)})} className={inputClass} />
                         </div>
                         <div>
                            <label className={labelClass}><Briefcase size={14} className="inline mr-1" /> Saldo FGTS (R$)</label>
                            <input type="number" value={editingLead.fgts} onChange={e => setEditingLead({...editingLead, fgts: Number(e.target.value)})} className={inputClass} />
                         </div>
                         <div>
                            <label className={labelClass}><Home size={14} className="inline mr-1" /> Valor do Imóvel (Referência)</label>
                            <div className="px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                               {formatCurrency(getPropertyPrice(editingLead.propertyId))}
                            </div>
                         </div>
                         <div className="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                            <Info className="text-blue-500 mt-0.5" size={18} />
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                               <strong>Nota:</strong> Alterações nestes valores recalcularão automaticamente o Score do lead (Ouro/Prata/Curioso) ao salvar.
                            </p>
                         </div>
                      </div>
                    )}

                    {/* TAB: DOCUMENTS (Structured Checklist) */}
                    {activeTab === 'docs' && (
                      <div className="space-y-8 animate-fadeIn">
                         
                         {/* Personal Data & Marital Status */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className={labelClass}>CPF</label><input type="text" value={editingLead.cpf || ''} onChange={e => setEditingLead({...editingLead, cpf: e.target.value})} className={inputClass} placeholder="000.000.000-00" /></div>
                            <div><label className={labelClass}>RG</label><input type="text" value={editingLead.rg || ''} onChange={e => setEditingLead({...editingLead, rg: e.target.value})} className={inputClass} /></div>
                            <div><label className={labelClass}>Estado Civil</label><select value={editingLead.maritalStatus || 'Solteiro'} onChange={e => setEditingLead({...editingLead, maritalStatus: e.target.value as any})} className={inputClass}><option value="Solteiro">Solteiro(a)</option><option value="Casado">Casado(a)</option><option value="Divorciado">Divorciado(a)</option><option value="Viuvo">Viúvo(a)</option><option value="UniaoEstavel">União Estável</option></select></div>
                            <div><label className={labelClass}>Profissão</label><input type="text" value={editingLead.profession || ''} onChange={e => setEditingLead({...editingLead, profession: e.target.value})} className={inputClass} /></div>
                            {editingLead.maritalStatus === 'Casado' && (<div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 animate-fadeIn"><div className="md:col-span-2 text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-slate-700 pb-2 mb-2">Dados do Cônjuge</div><div><label className={labelClass}>Nome do Cônjuge</label><input type="text" value={editingLead.spouseName || ''} onChange={e => setEditingLead({...editingLead, spouseName: e.target.value})} className={inputClass} /></div><div><label className={labelClass}>CPF do Cônjuge</label><input type="text" value={editingLead.spouseCpf || ''} onChange={e => setEditingLead({...editingLead, spouseCpf: e.target.value})} className={inputClass} /></div></div>)}
                         </div>

                         <div className="border-t border-gray-200 dark:border-slate-800 my-6"></div>

                         {/* Share Link Section */}
                         <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300">
                                    <Share2 size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                        Solicitar Documentos ao Cliente
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                                        Envie um link exclusivo para o WhatsApp do cliente. Ele poderá fotografar e enviar os documentos (RG, Renda, etc.) diretamente pelo celular, sem precisar de login. Os arquivos aparecerão automaticamente nesta lista.
                                    </p>
                                    
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => sendDocLinkWhatsapp(editingLead)}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                    Enviar Link no WhatsApp
                </button>
                <button 
                    type="button"
                    onClick={() => copyDocLink(editingLead.id)}
                    className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <LinkIcon size={18} />
                    Copiar Link
                </button>
            </div>
            
            <div className="mt-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs text-gray-500 dark:text-gray-400 font-mono break-all text-center">
                {generateDocLink(editingLead.id)}
            </div>
        </div>
    </div>
</div>

                         {/* DOCUMENT CHECKLIST */}
                         <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                               <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  <CheckCircle2 size={20} className="text-brand-500" />
                                  Checklist de Documentação
                               </h3>

                               <div className="flex items-center gap-4">
                                   {/* ZIP EXPORT BUTTON */}
                                   <button
                                     type="button"
                                     onClick={handleExportZip}
                                     disabled={calculateProgress(editingLead) === 0 || isExportingZip}
                                     className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                     title="Baixar todos os documentos em ZIP"
                                   >
                                     {isExportingZip ? <Loader2 size={16} className="animate-spin" /> : <FolderArchive size={16} />}
                                     <span className="hidden sm:inline">{isExportingZip ? 'Gerando ZIP...' : 'Exportar Tudo (.ZIP)'}</span>
                                   </button>
                                   
                                   {/* Progress Bar */}
                                   <div className="flex items-center gap-3 w-full sm:w-auto min-w-[200px]">
                                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                         <div 
                                           className="h-full bg-green-500 transition-all duration-500 ease-out"
                                           style={{ width: `${calculateProgress(editingLead)}%` }}
                                         ></div>
                                      </div>
                                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-12 text-right">{calculateProgress(editingLead)}%</span>
                                   </div>
                               </div>
                            </div>
                            
                            {/* Hidden Input for Checklist Uploads */}
                            <input 
                              type="file" 
                              ref={checklistFileInputRef} 
                              onChange={handleChecklistUpload} 
                              className="hidden" 
                              accept="image/*,.pdf" 
                              capture="environment" // Open camera directly on mobile
                            />

                            <div className="space-y-6">
                              {CHECKLIST_STRUCTURE.map((category) => (
                                <div key={category.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                   <div className="bg-gray-50 dark:bg-slate-950/50 px-5 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 text-sm">
                                         <category.icon size={16} className="text-gray-500 dark:text-gray-400" />
                                         {category.title}
                                      </h4>
                                      
                                      {/* Income Type Selector */}
                                      {category.dynamic && category.id === 'income' && (
                                        <select 
                                          value={editingLead.incomeType || 'CLT'}
                                          onChange={(e) => setEditingLead({...editingLead, incomeType: e.target.value as IncomeType})}
                                          className="text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-brand-500 text-gray-700 dark:text-gray-300"
                                        >
                                          <option value="CLT">CLT</option>
                                          <option value="Empresario">Empresário/MEI</option>
                                          <option value="Autonomo">Autônomo/Liberal</option>
                                        </select>
                                      )}
                                   </div>

                                   <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                      {(category.dynamic && category.id === 'income' ? getIncomeItems(editingLead.incomeType) : category.items)?.map((item) => {
                                         const status = editingLead.checklist?.[item.id] || { checked: false };
                                         
                                         return (
                                           <div key={item.id} className={`px-5 py-3 flex items-center justify-between transition-colors ${status.checked ? 'bg-green-50/50 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}>
                                              <div 
                                                className="flex items-center gap-3 cursor-pointer flex-1"
                                                onClick={() => toggleChecklistItem(item.id)}
                                              >
                                                 <div className={`flex-shrink-0 transition-colors ${status.checked ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`}>
                                                    {status.checked ? <CheckSquare size={20} /> : <Square size={20} />}
                                                 </div>
                                                 <span className={`text-sm ${status.checked ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                                                   {item.label}
                                                 </span>
                                              </div>
                                              
                                              <div className="flex items-center gap-2 pl-4">
                                                 {status.fileUrl ? (
                                                   <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1">
                                                      {/* Preview Button (Name) */}
                                                      <button 
                                                        type="button"
                                                        onClick={() => handleOpenPreview(status.fileUrl!, item.label)}
                                                        className="flex items-center gap-2 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 max-w-[120px] truncate hover:underline"
                                                        title="Visualizar documento"
                                                      >
                                                        <Eye size={14} />
                                                        {status.fileName}
                                                      </button>

                                                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                                                      {/* Download Button */}
                                                      <button 
                                                        type="button"
                                                        onClick={() => handleDownloadDoc(status.fileUrl!, status.fileName!, item.label, editingLead.name)}
                                                        className="text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors"
                                                        title="Baixar com nome padronizado"
                                                      >
                                                        <Download size={14} />
                                                      </button>

                                                      {/* Delete Button */}
                                                      <button 
                                                        type="button"
                                                        onClick={() => handleDeleteDoc(item.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                                                        title="Excluir documento"
                                                      >
                                                        <Trash2 size={14} />
                                                      </button>
                                                   </div>
                                                 ) : (
                                                   <button 
                                                     type="button" 
                                                     onClick={() => triggerChecklistUpload(item.id)}
                                                     className="p-1.5 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                                                     title="Anexar documento (Câmera)"
                                                   >
                                                      <Camera size={18} />
                                                   </button>
                                                 )}
                                              </div>
                                           </div>
                                         );
                                      })}
                                   </div>
                                </div>
                              ))}
                            </div>
                         </div>
                      </div>
                    )}

                 </form>
               </div>

               {/* Footer Actions */}
               <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 flex justify-between items-center">
                  <button 
                    type="button"
                    onClick={() => alert("Simulação de geração de PDF iniciada...")}
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg font-medium transition-colors shadow-sm"
                  >
                     <ScrollText size={18} />
                     <span className="hidden sm:inline">Gerar Proposta PDF</span>
                  </button>
                  <div className="flex gap-3">
                     <button onClick={() => setEditingLead(null)} className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
                        Cancelar
                     </button>
                     <button 
                       form="edit-lead-form"
                       type="submit" 
                       className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-lg shadow-brand-500/20 transition-all hover:scale-105"
                     >
                        <Save size={18} />
                        Salvar Alterações
                     </button>
                  </div>
               </div>

           </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-5xl h-full max-h-[90vh] flex flex-col">
             <div className="flex justify-between items-center mb-4 text-white">
                <h3 className="text-lg font-bold truncate pr-4">{previewDoc.title}</h3>
                <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"><X size={24} /></button>
             </div>
             <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center border border-white/10 relative">
                {previewDoc.type === 'pdf' ? (
                   <iframe src={previewDoc.url} className="w-full h-full" title="Preview"></iframe>
                ) : (
                   <img src={previewDoc.url} alt="Preview" className="max-w-full max-h-full object-contain" />
                )}
             </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 99px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
};