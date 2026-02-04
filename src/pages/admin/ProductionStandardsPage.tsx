import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Space,
  message,
  Popconfirm,
  Typography,
  Input,
  Breadcrumb,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SaveOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import * as api from "../../services/api";

const { Title, Text } = Typography;

export default function ProductionStandardsPage() {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [standards, setStandards] = useState([]);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();

  // Inline edit states
  const [editedStandards, setEditedStandards] = useState({});

  useEffect(() => {
    loadVehicleTypes();
  }, []);

  useEffect(() => {
    if (selectedVehicleType) {
      loadStandards();
      loadOperationsForVehicleType();
    }
  }, [selectedVehicleType]);

  const loadVehicleTypes = async () => {
    try {
      const res = await api.getVehicleTypes({ active: true });
      const types = res.data.data || [];
      setVehicleTypes(types);
      if (types.length > 0) {
        setSelectedVehicleType(types[0]);
      }
    } catch {
      message.error("Lỗi tải loại xe");
    } finally {
      setLoading(false);
    }
  };

  const loadStandards = async () => {
    try {
      const res = await api.getProductionStandards({
        vehicleTypeId: selectedVehicleType._id,
      });
      setStandards(res.data.data || []);
      setEditedStandards({});
      setHasChanges(false);
    } catch {
      message.error("Lỗi tải tiêu chuẩn");
    }
  };

  const loadOperationsForVehicleType = async () => {
    try {
      const processRes = await api.getProcesses({
        vehicleTypeId: selectedVehicleType._id,
      });
      const processes = processRes.data.data || [];
      let allOperations = [];
      for (const process of processes) {
        const opRes = await api.getOperations({ processId: process._id });
        const ops = (opRes.data.data || []).map((op) => ({
          ...op,
          processName: process.name,
        }));
        allOperations = [...allOperations, ...ops];
      }
      setOperations(allOperations);
    } catch {
      message.error("Lỗi tải thao tác");
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        vehicleTypeId: selectedVehicleType._id,
        bonusPerUnit: values.bonusPerUnit || 0,
        penaltyPerUnit: values.penaltyPerUnit || 0,
      };
      if (editingId) {
        await api.updateProductionStandard(editingId, data);
        message.success("Cập nhật thành công");
      } else {
        await api.createProductionStandard(data);
        message.success("Thêm thành công");
      }
      setModalOpen(false);
      setEditingId(null);
      form.resetFields();
      loadStandards();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleInlineEdit = (standardId, field, value) => {
    setEditedStandards((prev) => ({
      ...prev,
      [standardId]: {
        ...prev[standardId],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      const updates = Object.entries(editedStandards).map(([id, changes]) =>
        api.updateProductionStandard(id, changes),
      );
      await Promise.all(updates);
      message.success("Lưu thành công!");
      loadStandards();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteProductionStandard(id);
      message.success("Xóa thành công");
      loadStandards();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN").format(value);

  const getProcessTag = (processName) => {
    const name = (processName || "").toLowerCase();
    if (name.includes("lắp") || name.includes("assembly"))
      return { bg: "#DBEAFE", color: "#2563EB", text: "LẮP RÁP" };
    if (name.includes("hàn") || name.includes("weld"))
      return { bg: "#FEF3C7", color: "#D97706", text: "HÀN" };
    if (name.includes("sơn") || name.includes("paint"))
      return { bg: "#FCE7F3", color: "#DB2777", text: "SƠN" };
    if (name.includes("điện") || name.includes("electric"))
      return { bg: "#D1FAE5", color: "#059669", text: "ĐIỆN" };
    if (name.includes("kiểm") || name.includes("qc"))
      return { bg: "#EDE9FE", color: "#7C3AED", text: "CHẤT LƯỢNG" };
    return { bg: "#F1F5F9", color: "#64748B", text: "KHÁC" };
  };

  // Filtered standards
  const filteredStandards = standards.filter((std) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      std.operationId?.name?.toLowerCase().includes(search) ||
      std.operationId?.code?.toLowerCase().includes(search)
    );
  });

  // Calculate stats
  const maxBonus = standards.reduce(
    (max, s) =>
      Math.max(
        max,
        (s.bonusPerUnit || 0) *
          (s.operationId?.standardQuantity || s.expectedQuantity || 0),
      ),
    0,
  );
  const maxPenalty = standards.reduce(
    (max, s) =>
      Math.max(
        max,
        (s.penaltyPerUnit || 0) *
          (s.operationId?.standardQuantity || s.expectedQuantity || 0),
      ),
    0,
  );
  const avgEfficiency = 94.5; // This would be calculated from actual data

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>Sản xuất</Breadcrumb.Item>
        <Breadcrumb.Item>Cấu hình</Breadcrumb.Item>
        <Breadcrumb.Item>Định mức & Khấu trừ</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Định mức sản xuất
        </Title>
        <Text type="secondary">
          Cấu hình mục tiêu sản lượng và cơ cấu thưởng/phạt cho từng loại xe.
        </Text>
      </div>

      {/* Controls Row */}
      <div className="stitch-card" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <Text
              type="secondary"
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 4,
              }}
            >
              Loại xe
            </Text>
            <Select
              value={selectedVehicleType?._id}
              onChange={(value) =>
                setSelectedVehicleType(
                  vehicleTypes.find((v) => v._id === value),
                )
              }
              style={{ width: 200 }}
            >
              {vehicleTypes.map((vt) => (
                <Select.Option key={vt._id} value={vt._id}>
                  {vt.name} ({vt.code})
                </Select.Option>
              ))}
            </Select>
          </div>
          <div>
            <Text
              type="secondary"
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                display: "block",
                marginBottom: 4,
              }}
            >
              Tìm thao tác
            </Text>
            <Input.Search
              placeholder="VD: Pin, Khung, Sơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 250 }}
            />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
            <Button icon={<ReloadOutlined />} onClick={loadStandards}>
              Đặt lại
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              disabled={!hasChanges}
              onClick={handleSaveChanges}
              style={{ background: "var(--primary)" }}
            >
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </div>

      {/* Standards Table */}
      {selectedVehicleType && (
        <div className="stitch-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="stitch-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>CHI TIẾT THAO TÁC</th>
                <th style={{ textAlign: "center", color: "var(--primary)" }}>
                  TIÊU CHUẨN
                </th>
                <th style={{ textAlign: "center" }}>PHÚT / SP</th>
                <th style={{ textAlign: "center", color: "var(--success)" }}>
                  THƯỞng{" "}
                  <span style={{ fontSize: 10, fontWeight: 400 }}>
                    (mỗi sp vượt)
                  </span>
                </th>
                <th style={{ textAlign: "center", color: "var(--danger)" }}>
                  PHẠT{" "}
                  <span style={{ fontSize: 10, fontWeight: 400 }}>
                    (mỗi sp thiếu)
                  </span>
                </th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredStandards.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 40 }}>
                    <Text type="secondary">Chưa có định mức. </Text>
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        form.resetFields();
                        setEditingId(null);
                        setModalOpen(true);
                      }}
                    >
                      Thêm mới
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredStandards.map((std) => {
                  const tag = getProcessTag(std.operationId?.processId?.name);
                  const currentValues = editedStandards[std._id] || {};

                  return (
                    <tr key={std._id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {std.operationId?.name}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 4,
                          }}
                        >
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            ID: {std.operationId?.code}
                          </Text>
                          <span
                            style={{
                              background: tag.bg,
                              color: tag.color,
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            {tag.text}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--primary)",
                            fontSize: 16,
                          }}
                        >
                          {std.operationId?.standardQuantity ||
                            std.expectedQuantity ||
                            "—"}
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          sp / ca
                        </Text>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Text style={{ fontSize: 14 }}>
                          {std.operationId?.standardMinutes?.toFixed(1) || "—"}p
                        </Text>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{ color: "var(--success)", marginRight: 4 }}
                          >
                            +
                          </span>
                          <InputNumber
                            value={
                              currentValues.bonusPerUnit ??
                              std.bonusPerUnit ??
                              0
                            }
                            onChange={(val) =>
                              handleInlineEdit(std._id, "bonusPerUnit", val)
                            }
                            formatter={(value) =>
                              `${formatCurrency(value || 0)} đ`
                            }
                            parser={(value) => value.replace(/[^\d]/g, "")}
                            style={{
                              width: 120,
                              borderColor: "var(--success)",
                              background: "rgba(16, 185, 129, 0.05)",
                            }}
                            className="input-bonus"
                            min={0}
                          />
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{ color: "var(--danger)", marginRight: 4 }}
                          >
                            -
                          </span>
                          <InputNumber
                            value={
                              currentValues.penaltyPerUnit ??
                              std.penaltyPerUnit ??
                              0
                            }
                            onChange={(val) =>
                              handleInlineEdit(std._id, "penaltyPerUnit", val)
                            }
                            formatter={(value) =>
                              `${formatCurrency(value || 0)} đ`
                            }
                            parser={(value) => value.replace(/[^\d]/g, "")}
                            style={{
                              width: 120,
                              borderColor: "var(--danger)",
                              background: "rgba(239, 68, 68, 0.05)",
                            }}
                            className="input-penalty"
                            min={0}
                          />
                        </div>
                      </td>
                      <td>
                        <Popconfirm
                          title="Xóa định mức này?"
                          onConfirm={() => handleDelete(std._id)}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                          />
                        </Popconfirm>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border-light)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text type="secondary">
              Hiển thị {filteredStandards.length} / {standards.length} thao tác
              của {selectedVehicleType?.name}
            </Text>
            <Space>
              <Button disabled>Trước</Button>
              <Button disabled>Sau</Button>
            </Space>
          </div>
        </div>
      )}

      {/* Bottom Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        <div
          className="stat-card"
          style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
        >
          <div className="stat-card-icon green">
            <TrophyOutlined />
          </div>
          <div>
            <div className="stat-card-value" style={{ fontSize: 24 }}>
              {formatCurrency(maxBonus)}
            </div>
            <div className="stat-card-label">đ/ca</div>
            <div className="stat-card-label">Thưởng tối đa</div>
          </div>
        </div>
        <div
          className="stat-card"
          style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
        >
          <div className="stat-card-icon red">
            <ThunderboltOutlined />
          </div>
          <div>
            <div className="stat-card-value" style={{ fontSize: 24 }}>
              {formatCurrency(maxPenalty)}
            </div>
            <div className="stat-card-label">đ/ca</div>
            <div className="stat-card-label">Phạt tối đa</div>
          </div>
        </div>
        <div
          className="stat-card"
          style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
        >
          <div className="stat-card-icon blue">
            <PercentageOutlined />
          </div>
          <div>
            <div className="stat-card-value" style={{ fontSize: 24 }}>
              {avgEfficiency}%
            </div>
            <div className="stat-card-label">Hiệu suất mục tiêu TB</div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        title="Thêm định mức sản xuất"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="operationId"
            label="Thao tác"
            rules={[{ required: true, message: "Chọn thao tác" }]}
          >
            <Select
              placeholder="Chọn thao tác..."
              showSearch
              optionFilterProp="children"
            >
              {operations.map((op) => (
                <Select.Option key={op._id} value={op._id}>
                  [{op.processName}] {op.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="expectedQuantity"
            label="Số lượng dự kiến/ngày"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Form.Item name="bonusPerUnit" label="Thưởng/sp (đ)">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
            <Form.Item name="penaltyPerUnit" label="Phạt/sp (đ)">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
            </Form.Item>
          </div>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{ background: "var(--primary)" }}
              >
                Tạo mới
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
