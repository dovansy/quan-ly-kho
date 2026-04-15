import { Form } from 'antd';
import { useState } from 'react';

interface CrudRecord {
  key: string;
  id: number;
}

export function useCrudTable<T extends CrudRecord>(initialData: T[]) {
  const [filterForm] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<T[]>(initialData);
  const [filteredData, setFilteredData] = useState<T[]>(initialData);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);

  const openCreateModal = (defaultValues?: Record<string, any>) => {
    setEditingRecord(null);
    modalForm.resetFields();
    if (defaultValues) {
      modalForm.setFieldsValue(defaultValues);
    }
    setModalOpen(true);
  };

  const openEditModal = (record: T, fieldValues?: Record<string, any>) => {
    setEditingRecord(record);
    modalForm.setFieldsValue(fieldValues ?? record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    modalForm.resetFields();
  };

  const handleCreate = (newRecord: T) => {
    const updated = [...dataSource, newRecord];
    setDataSource(updated);
    setFilteredData(updated);
    closeModal();
  };

  const handleUpdate = (values: Partial<T>) => {
    if (!editingRecord) return;
    const updated = dataSource.map(item =>
      item.key === editingRecord.key ? { ...item, ...values } : item
    );
    setDataSource(updated);
    setFilteredData(updated);
    closeModal();
  };

  const handleDelete = (record: T) => {
    const updated = dataSource.filter(item => item.key !== record.key);
    setDataSource(updated);
    setFilteredData(updated);
  };

  const handleSearch = (filterFn: (item: T) => boolean) => {
    setLoading(true);
    const result = dataSource.filter(filterFn);
    setTimeout(() => {
      setFilteredData(result);
      setLoading(false);
    }, 300);
  };

  const handleClearFilter = () => {
    filterForm.resetFields();
    setFilteredData(dataSource);
  };

  const getNextId = () => Math.max(...dataSource.map(d => d.id), 0) + 1;

  return {
    filterForm,
    modalForm,
    loading,
    dataSource,
    filteredData,
    modalOpen,
    editingRecord,
    openCreateModal,
    openEditModal,
    closeModal,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleSearch,
    handleClearFilter,
    getNextId,
  };
}
