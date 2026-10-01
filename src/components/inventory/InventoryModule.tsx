import React, { useState } from 'react';
import { Product, StockAdjustment } from '../../types';
import {
  Plus,
  Search,
  AlertTriangle,
  Barcode,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Package,
  ArrowUpDown,
  Check,
  X,
  Sparkles,
  Eye,
  CheckCircle,
  XCircle,
  Power,
  Info,
} from 'lucide-react';

interface InventoryModuleProps {
  products: Product[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteMultipleProducts?: (productIds: string[]) => void;
  onAdjustStock: (adjustment: StockAdjustment) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
  onDeleteMultipleProducts,
  onAdjustStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [stockFilter, setStockFilter] = useState<'todos' | 'bajo'>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // Multi-selection state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // View Details Modal state
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Adjustment Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<StockAdjustment['reason']>('merma');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustNotes, setAdjustNotes] = useState('');

  // Form Fields for Product
  const [formBarcode, setFormBarcode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Escolares');
  const [formBrand, setFormBrand] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('10.00');
  const [formSalePrice, setFormSalePrice] = useState('15.00');
  const [formStock, setFormStock] = useState('20');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formUnitType, setFormUnitType] = useState<'pieza' | 'paquete'>('pieza');
  const [formPackageUnits, setFormPackageUnits] = useState('12');
  const [formPackageCostPrice, setFormPackageCostPrice] = useState('');
  const [formPackageSalePrice, setFormPackageSalePrice] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const categories = ['todos', 'Escolares', 'Papelería', 'Oficina', 'Arte y Dibujo', 'Tecnología', 'Envolturas y Regalos', 'Otros'];

  // Helper to generate internal barcode for bulk items (e.g., cartulinas, lápices a granel)
  const generateInternalBarcode = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    setFormBarcode(`ESC-${randomSuffix}`);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    generateInternalBarcode();
    setFormName('');
    setFormCategory('Escolares');
    setFormBrand('');
    setFormCostPrice('10.00');
    setFormSalePrice('16.00');
    setFormStock('20');
    setFormMinStock('5');
    setFormUnitType('pieza');
    setFormPackageUnits('12');
    setFormPackageCostPrice('');
    setFormPackageSalePrice('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormBarcode(product.barcode);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormBrand(product.brand);
    setFormCostPrice(product.costPrice.toString());
    setFormSalePrice(product.salePrice.toString());
    setFormStock(product.stock.toString());
    setFormMinStock(product.minStock.toString());
    setFormUnitType(product.unitType);
    setFormPackageUnits(product.packageUnits.toString());
    setFormPackageCostPrice(product.packageCostPrice ? product.packageCostPrice.toString() : '');
    setFormPackageSalePrice(product.packageSalePrice ? product.packageSalePrice.toString() : '');
    setFormIsActive(product.isActive !== false);
    setIsModalOpen(true);
  };

  // Toggle active/inactive
  const handleToggleProductActive = (product: Product) => {
    const updated = {
      ...product,
      isActive: !product.isActive,
    };
    onSaveProduct(updated);
  };

  // Profit Margin calculation
  const cost = parseFloat(formCostPrice) || 0;
  const price = parseFloat(formSalePrice) || 0;
  const calculatedMargin = cost > 0 ? (((price - cost) / cost) * 100).toFixed(1) : '0';

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBarcode.trim()) {
      alert('Nombre y código de barras son requeridos.');
      return;
    }

    const costNum = parseFloat(formCostPrice) || 0;
    const saleNum = parseFloat(formSalePrice) || 0;
    const stockNum = parseInt(formStock, 10) || 0;
    const minStockNum = parseInt(formMinStock, 10) || 0;
    const pkgUnitsNum = parseInt(formPackageUnits, 10) || 1;

    const updatedProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      barcode: formBarcode.trim(),
      name: formName.trim(),
      category: formCategory,
      brand: formBrand.trim(),
      costPrice: costNum,
      salePrice: saleNum,
      stock: stockNum,
      minStock: minStockNum,
      unitType: formUnitType,
      packageUnits: pkgUnitsNum,
      packageCostPrice: formPackageCostPrice ? parseFloat(formPackageCostPrice) : undefined,
      packageSalePrice: formPackageSalePrice ? parseFloat(formPackageSalePrice) : undefined,
      isActive: formIsActive,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      lastRestockDate: new Date().toISOString(),
    };

    onSaveProduct(updatedProduct);
    setIsModalOpen(false);
  };

  const openAdjustStockModal = (prod: Product) => {
    setSelectedProductForAdjust(prod);
    setAdjustType('merma');
    setAdjustQuantity(1);
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleConfirmAdjust = () => {
    if (!selectedProductForAdjust) return;
    const previousStock = selectedProductForAdjust.stock;
    const qty = Math.abs(adjustQuantity);
    const newStock = Math.max(0, previousStock - qty);

    const adjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      productId: selectedProductForAdjust.id,
      productName: selectedProductForAdjust.name,
      barcode: selectedProductForAdjust.barcode,
      previousStock,
      newStock,
      quantityAdjusted: qty,
      reason: adjustType,
      notes: adjustNotes,
      date: new Date().toISOString(),
      user: 'Admin',
    };

    onAdjustStock(adjustment);
    setIsAdjustModalOpen(false);
  };

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'todos' || prod.category === categoryFilter;
    const matchesStock = stockFilter === 'todos' || (stockFilter === 'bajo' && prod.stock <= prod.minStock);
    const matchesStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'activos' && prod.isActive !== false) ||
      (statusFilter === 'inactivos' && prod.isActive === false);

    return matchesSearch && matchesCategory && matchesStock && matchesStatus;
  });

  const lowStockProductsCount = products.filter((p) => p.stock <= p.minStock).length;

  // Multi-selection handlers
  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProductIds.includes(p.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredProducts.map((p) => p.id));
      setSelectedProductIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = new Set([...selectedProductIds, ...filteredProducts.map((p) => p.id)]);
      setSelectedProductIds(Array.from(newIds));
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedProductIds.length === 0) return;
    if (
      confirm(
        `¿Eliminar definitivamente los ${selectedProductIds.length} productos seleccionados? Esta acción no se puede deshacer.`
      )
    ) {
      if (onDeleteMultipleProducts) {
        onDeleteMultipleProducts(selectedProductIds);
      } else {
        selectedProductIds.forEach((id) => onDeleteProduct(id));
      }
      setSelectedProductIds([]);
    }
  };

  const handleToggleActiveSelected = (newActiveState: boolean) => {
    if (selectedProductIds.length === 0) return;
    const targets = products.filter((p) => selectedProductIds.includes(p.id));
    targets.forEach((p) => {
      onSaveProduct({ ...p, isActive: newActiveState });
    });
    setSelectedProductIds([]);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 pb-16 md:pb-0">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1F4461] tracking-tight">
              Catálogo e Inventario
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Control de existencias, código de barras, piezas, paquetes y activación de productos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, marca o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#1F4461] text-xs font-medium outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              {(['todos', 'activos', 'inactivos'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-[#1F4461] shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c === 'todos' ? 'Todas las Categorías' : c}
                </option>
              ))}
            </select>

            <button
              onClick={() => setStockFilter(stockFilter === 'bajo' ? 'todos' : 'bajo')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                stockFilter === 'bajo'
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Stock Bajo ({lowStockProductsCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {/* Bulk Action Bar */}
        {selectedProductIds.length > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-[#1F4461] text-white flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-[#9CC55B] text-[#1F4461] font-black text-xs flex items-center justify-center shadow-xs">
                {selectedProductIds.length}
              </span>
              <span className="text-xs font-bold">
                {selectedProductIds.length === 1
                  ? '1 producto seleccionado'
                  : `${selectedProductIds.length} productos seleccionados`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleActiveSelected(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-emerald-300 transition cursor-pointer"
              >
                Activar
              </button>
              <button
                onClick={() => handleToggleActiveSelected(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-amber-300 transition cursor-pointer"
              >
                Desactivar
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition cursor-pointer shadow-sm active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar Seleccionados</span>
              </button>
              <button
                onClick={() => setSelectedProductIds([])}
                className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-xs text-gray-300 cursor-pointer transition"
              >
                Deseleccionar
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected && filteredProducts.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-[#1F4461] cursor-pointer"
                      title="Seleccionar todos los productos visibles"
                    />
                  </th>
                  <th className="py-3 px-4">Producto & Código</th>
                  <th className="py-3 px-4">Categoría / Marca</th>
                  <th className="py-3 px-4 text-center">Tipo & Paquete</th>
                  <th className="py-3 px-4 text-right">Costo</th>
                  <th className="py-3 px-4 text-right">Precio Venta</th>
                  <th className="py-3 px-4 text-center">Margen</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400">
                      No se encontraron productos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const isLowStock = prod.stock <= prod.minStock;
                    const isSelected = selectedProductIds.includes(prod.id);
                    const margin = prod.costPrice > 0 ? (((prod.salePrice - prod.costPrice) / prod.costPrice) * 100).toFixed(0) : '0';

                    return (
                      <tr
                        key={prod.id}
                        className={`transition ${isSelected ? 'bg-[#1F4461]/5' : 'hover:bg-gray-50/80'}`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectProduct(prod.id)}
                            className="w-4 h-4 rounded text-[#1F4461] cursor-pointer"
                            title={`Seleccionar ${prod.name}`}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{prod.name}</p>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400 mt-0.5">
                            <Barcode className="w-3.5 h-3.5" />
                            <span>{prod.barcode}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-800">{prod.category}</span>
                          <span className="block text-[11px] text-gray-400">{prod.brand || '—'}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {prod.unitType === 'paquete' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                              <Package className="w-3 h-3" />
                              <span>Paq. ({prod.packageUnits} pz)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px]">
                              Pieza suelta
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-600">
                          ${prod.costPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#1F4461]">
                          ${prod.salePrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                            +{margin}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                                isLowStock
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                  : 'bg-emerald-50 text-emerald-800'
                              }`}
                            >
                              {prod.stock} pzas
                            </span>
                            {isLowStock && (
                              <span className="text-[10px] text-amber-700 font-medium mt-0.5">
                                Min: {prod.minStock}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Estado: Activo / Desactivado Toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleProductActive(prod)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer flex items-center gap-1 mx-auto ${
                              prod.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            title="Haz clic para activar o desactivar este producto"
                          >
                            <Power className="w-3 h-3" />
                            <span>{prod.isActive !== false ? 'Activo' : 'Inactivo'}</span>
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Ver Detalles */}
                            <button
                              onClick={() => setViewingProduct(prod)}
                              title="Ver detalles completos del producto"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-[#1F4461] hover:bg-gray-100 transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Ajuste manual */}
                            <button
                              onClick={() => openAdjustStockModal(prod)}
                              title="Ajuste rápido de stock (Merma/Dañado/Uso interno)"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                            >
                              <SlidersHorizontal className="w-4 h-4" />
                            </button>

                            {/* Editar */}
                            <button
                              onClick={() => openEditModal(prod)}
                              title="Editar producto"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-[#1F4461] hover:bg-blue-50 transition cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Borrar */}
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar ${prod.name}?`)) {
                                  onDeleteProduct(prod.id);
                                }
                              }}
                              title="Eliminar producto"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="bg-[#1F4461] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingProduct ? 'Editar Producto' : 'Alta Rápida de Producto'}
                </h3>
                <p className="text-xs text-gray-300">Detalles de inventario, código y precios</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Barcode & Internal generator */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Código de Barras:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      placeholder="Ej. 7501000100012"
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={generateInternalBarcode}
                      className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700 border border-gray-300 transition cursor-pointer"
                      title="Generar código interno para producto a granel"
                    >
                      Autogenerar
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nombre del Producto:
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Cuaderno Profesional 100 Hojas"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-medium outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Categoría:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-medium outline-none"
                  >
                    {categories
                      .filter((c) => c !== 'todos')
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Marca:</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="Ej. Scribe, BIC, Dixon, Pelikan"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-medium outline-none"
                  />
                </div>

                {/* Unit Type: Pieza vs Paquete */}
                <div className="md:col-span-2 p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#1F4461] block">
                        Manejo de Piezas vs. Paquetes
                      </span>
                      <span className="text-[11px] text-gray-600">
                        ¿Compras caja o paquete pero vendes por piezas sueltas?
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormUnitType('pieza')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          formUnitType === 'pieza'
                            ? 'bg-[#1F4461] text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                        }`}
                      >
                        Solo Pieza
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormUnitType('paquete')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          formUnitType === 'paquete'
                            ? 'bg-[#1F4461] text-white'
                            : 'bg-white text-gray-700 border border-gray-300'
                        }`}
                      >
                        Maneja Paquete
                      </button>
                    </div>
                  </div>

                  {formUnitType === 'paquete' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-blue-200">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Piezas por Paquete:
                        </label>
                        <input
                          type="number"
                          min="2"
                          value={formPackageUnits}
                          onChange={(e) => setFormPackageUnits(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Costo por Caja ($):
                        </label>
                        <input
                          type="number"
                          step="0.10"
                          value={formPackageCostPrice}
                          onChange={(e) => setFormPackageCostPrice(e.target.value)}
                          placeholder="Opcional"
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Precio Venta Caja ($):
                        </label>
                        <input
                          type="number"
                          step="0.10"
                          value={formPackageSalePrice}
                          onChange={(e) => setFormPackageSalePrice(e.target.value)}
                          placeholder="Opcional"
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-mono outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Cost and Sale Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Costo Unitario ($):
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700">Precio Venta Público ($):</label>
                    <span className="text-[11px] font-bold text-emerald-700">Margen: +{calculatedMargin}%</span>
                  </div>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-emerald-300 focus:border-emerald-600 text-xs font-mono font-bold outline-none"
                  />
                </div>

                {/* Stock & Minimum stock */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Existencias Actuales (Piezas):
                  </label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Alerta de Stock Mínimo:
                  </label>
                  <input
                    type="number"
                    required
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    placeholder="Ej. 10"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#1F4461] text-xs font-mono outline-none"
                  />
                  <span className="text-[10px] text-gray-400">Avisa cuando queden menos piezas</span>
                </div>
                {/* Estado Activo / Desactivado in Form */}
                <div className="md:col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">Estado del Producto</span>
                    <span className="text-[11px] text-gray-500">¿Está disponible para la venta en caja?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      formIsActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{formIsActive ? 'Activo (Disponible)' : 'Desactivado (Oculto en Caja)'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#9CC55B] hover:bg-[#8bb44c] text-[#1F4461] font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PRODUCT DETAILS MODAL (VER DETALLES) */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="bg-[#1F4461] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#9CC55B]" />
                <h3 className="font-bold text-base">Ficha del Producto</h3>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-gray-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {viewingProduct.brand || viewingProduct.category}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      viewingProduct.isActive !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {viewingProduct.isActive !== false ? 'Activo en Tienda' : 'Desactivado'}
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-[#1F4461]">{viewingProduct.name}</h2>
                <div className="flex items-center gap-1.5 font-mono text-gray-500 mt-1">
                  <Barcode className="w-4 h-4" />
                  <span className="font-bold">{viewingProduct.barcode}</span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-500 block">Categoría:</span>
                  <span className="font-bold text-gray-800">{viewingProduct.category}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Marca:</span>
                  <span className="font-bold text-gray-800">{viewingProduct.brand || 'Genérica'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Precio Costo:</span>
                  <span className="font-mono font-bold text-gray-900">${viewingProduct.costPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Precio Venta Público:</span>
                  <span className="font-mono font-black text-[#1F4461] text-sm">${viewingProduct.salePrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Margen de Ganancia:</span>
                  <span className="font-bold text-emerald-700">
                    +{viewingProduct.costPrice > 0 ? (((viewingProduct.salePrice - viewingProduct.costPrice) / viewingProduct.costPrice) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Existencias:</span>
                  <span className="font-mono font-bold text-gray-900">{viewingProduct.stock} pzas</span>
                  <span className="text-[10px] text-gray-400 block">(Mínimo: {viewingProduct.minStock})</span>
                </div>
              </div>

              {/* Package handling information */}
              {viewingProduct.unitType === 'paquete' && (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-[11px] space-y-1">
                  <span className="font-bold text-[#1F4461] block">Manejo de Paquete / Caja:</span>
                  <p className="text-gray-700">
                    Contiene <strong>{viewingProduct.packageUnits} piezas</strong> por caja.
                  </p>
                  {viewingProduct.packageSalePrice && (
                    <p className="text-gray-700 font-mono">
                      Precio de caja completa: <strong>${viewingProduct.packageSalePrice.toFixed(2)}</strong>
                    </p>
                  )}
                </div>
              )}

              <div className="text-[11px] text-gray-400">
                Registrado el {new Date(viewingProduct.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    const toEdit = viewingProduct;
                    setViewingProduct(null);
                    openEditModal(toEdit);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1F4461] hover:bg-[#163248] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  Editar Producto
                </button>
                <button
                  onClick={() => setViewingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUSTMENT MODAL (Merma, Dañado, Uso Interno) */}
      {isAdjustModalOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-[#1F4461] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Ajuste Manual de Stock</h3>
                <p className="text-xs text-gray-300">{selectedProductForAdjust.name}</p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <span>Stock Actual en Sistema:</span>
                <span className="font-bold font-mono text-base text-[#1F4461]">
                  {selectedProductForAdjust.stock} pzas
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Motivo del Ajuste:</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as StockAdjustment['reason'])}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold outline-none"
                >
                  <option value="merma">Merma</option>
                  <option value="producto dañado">Producto Dañado / Roto</option>
                  <option value="uso interno">Uso Interno del Negocio</option>
                  <option value="conteo de inventario">Diferencia en Conteo Físico</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Cantidad a Deducir (Piezas):
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProductForAdjust.stock}
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notas / Justificación:</label>
                <textarea
                  rows={2}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Ej. Cartulina manchada por derrame o pluma para uso en caja"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdjust}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
