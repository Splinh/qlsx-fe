import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Checkbox,
  Space,
  message,
  Popconfirm,
  Typography,
  Empty,
  Select,
  Rate,
  Breadcrumb,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import * as api from "../../services/api";

const { Title, Text } = Typography;

export default function ProcessManagementPage() {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [operations, setOperations] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [operationModalOpen, setOperationModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  const [editingOperation, setEditingOperation] = useState(null);

  const [processForm] = Form.useForm();
  const [operationForm] = Form.useForm();

  useEffect(() => {
    loadVehicleTypes();
  }, []);

  useEffect(() => {
    if (selectedVehicleType) {
      loadProcesses();
      setSelectedProcess(null);
      setOperations([]);
    }
  }, [selectedVehicleType]);

  useEffect(() => {
    if (selectedProcess) {
      loadOperations();
    }
  }, [selectedProcess]);

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

  const loadProcesses = async () => {
    try {
      const res = await api.getProcesses({
        vehicleTypeId: selectedVehicleType._id,
      });
      const procs = res.data.data || [];
      setProcesses(procs);
      if (procs.length > 0 && !selectedProcess) {
        setSelectedProcess(procs[0]);
      }
    } catch {
      message.error("Lỗi tải công đoạn");
    }
  };

  const loadOperations = async () => {
    try {
      const res = await api.getOperations({ processId: selectedProcess._id });
      setOperations(res.data.data || []);
    } catch {
      message.error("Lỗi tải thao tác");
    }
  };

  // Process CRUD
  const handleProcessSubmit = async (values) => {
    try {
      const data = { ...values, vehicleTypeId: selectedVehicleType._id };
      if (editingProcess) {
        await api.updateProcess(editingProcess._id, data);
        message.success("Cập nhật công đoạn thành công");
      } else {
        await api.createProcess(data);
        message.success("Thêm công đoạn thành công");
      }
      setProcessModalOpen(false);
      setEditingProcess(null);
      processForm.resetFields();
      loadProcesses();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleDeleteProcess = async (id) => {
    try {
      await api.deleteProcess(id);
      message.success("Xóa công đoạn thành công");
      loadProcesses();
      if (selectedProcess?._id === id) {
        setSelectedProcess(null);
        setOperations([]);
      }
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  // Operation CRUD
  const handleOperationSubmit = async (values) => {
    try {
      const data = { ...values, processId: selectedProcess._id };
      if (editingOperation) {
        await api.updateOperation(editingOperation._id, data);
        message.success("Cập nhật thao tác thành công");
      } else {
        await api.createOperation(data);
        message.success("Thêm thao tác thành công");
      }
      setOperationModalOpen(false);
      setEditingOperation(null);
      operationForm.resetFields();
      loadOperations();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleDeleteOperation = async (id) => {
    try {
      await api.deleteOperation(id);
      message.success("Xóa thao tác thành công");
      loadOperations();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const openProcessModal = (process = null) => {
    setEditingProcess(process);
    if (process) {
      processForm.setFieldsValue(process);
    } else {
      processForm.resetFields();
      processForm.setFieldsValue({ order: processes.length + 1 });
    }
    setProcessModalOpen(true);
  };

  const openOperationModal = (operation = null) => {
    setEditingOperation(operation);
    if (operation) {
      operationForm.setFieldsValue(operation);
    } else {
      operationForm.resetFields();
      operationForm.setFieldsValue({
        difficulty: 3,
        maxWorkers: 1,
        allowTeamwork: false,
      });
    }
    setOperationModalOpen(true);
  };

  // Calculate totals for selected process
  const totalOperations = operations.length;
  const totalTime = operations.reduce(
    (sum, op) => sum + (op.standardMinutes || 0),
    0,
  );
  const totalWorkers = operations.reduce(
    (sum, op) => sum + (op.maxWorkers || 1),
    0,
  );

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item>Sản xuất</Breadcrumb.Item>
        <Breadcrumb.Item>Quản lý công đoạn</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Công đoạn & Thao tác
          </Title>
          <Text type="secondary">
            Cấu hình quy trình lắp ráp và tiêu chuẩn vận hành.
          </Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Text type="secondary">Loại xe:</Text>
          <Select
            value={selectedVehicleType?._id}
            onChange={(value) =>
              setSelectedVehicleType(vehicleTypes.find((v) => v._id === value))
            }
            style={{ width: 200 }}
            placeholder="Chọn loại xe..."
          >
            {vehicleTypes.map((vt) => (
              <Select.Option key={vt._id} value={vt._id}>
                {vt.name} ({vt.code})
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      {selectedVehicleType && (
        <div
          style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}
        >
          {/* Left Panel - Assembly Stages */}
          <div
            className="stitch-card"
            style={{ padding: 0, overflow: "hidden" }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-light)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text strong>Các công đoạn lắp ráp</Text>
              <Button
                type="text"
                icon={<SettingOutlined />}
                size="small"
                onClick={() => openProcessModal()}
              />
            </div>

            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {processes.length === 0 ? (
                <Empty
                  description="Chưa có công đoạn"
                  style={{ padding: 40 }}
                />
              ) : (
                processes.map((p, index) => (
                  <div
                    key={p._id}
                    onClick={() => setSelectedProcess(p)}
                    style={{
                      padding: "16px 20px",
                      cursor: "pointer",
                      borderLeft:
                        selectedProcess?._id === p._id
                          ? "3px solid var(--primary)"
                          : "3px solid transparent",
                      background:
                        selectedProcess?._id === p._id
                          ? "var(--primary-light)"
                          : "transparent",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background:
                            selectedProcess?._id === p._id
                              ? "var(--primary)"
                              : "var(--bg-page)",
                          color:
                            selectedProcess?._id === p._id
                              ? "white"
                              : "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color:
                              selectedProcess?._id === p._id
                                ? "var(--primary)"
                                : "var(--text-primary)",
                          }}
                        >
                          {p.name}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {operations.length > 0 &&
                          selectedProcess?._id === p._id
                            ? `${totalOperations} Thao tác • ${Math.round(totalTime)} phút`
                            : p.code}
                        </Text>
                      </div>
                      <Popconfirm
                        title="Xóa công đoạn này?"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          handleDeleteProcess(p._id);
                        }}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                          style={{ opacity: 0.5 }}
                        />
                      </Popconfirm>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--border-light)",
              }}
            >
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                block
                onClick={() => openProcessModal()}
              >
                Thêm công đoạn mới
              </Button>
            </div>
          </div>

          {/* Right Panel - Operations */}
          <div
            className="stitch-card"
            style={{ padding: 0, overflow: "hidden" }}
          >
            {selectedProcess ? (
              <>
                {/* Operations Header */}
                <div
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid var(--border-light)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <Title level={5} style={{ margin: 0 }}>
                        Thao tác {selectedProcess.name}
                      </Title>
                      <span className="badge badge-success">
                        Đang hoạt động
                      </span>
                    </div>
                    <Space style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        <ToolOutlined /> {totalOperations} Bước
                      </Text>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        <ClockCircleOutlined /> {Math.round(totalTime)} phút
                      </Text>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        <TeamOutlined /> {totalWorkers} Kỹ thuật viên
                      </Text>
                    </Space>
                  </div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => openOperationModal()}
                    style={{ background: "var(--primary)" }}
                  >
                    Thêm thao tác
                  </Button>
                </div>

                {/* Operations Table */}
                <div style={{ padding: "0 24px" }}>
                  {operations.length === 0 ? (
                    <Empty
                      description="Chưa có thao tác"
                      style={{ padding: 60 }}
                    />
                  ) : (
                    <table className="stitch-table" style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}>#</th>
                          <th>TÊN THAO TÁC</th>
                          <th style={{ textAlign: "center" }}>TIÊU CHUẨN</th>
                          <th style={{ textAlign: "center" }}>ĐỘ KHÓ</th>
                          <th style={{ width: 60 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {operations.map((op, index) => (
                          <tr key={op._id}>
                            <td>
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: "50%",
                                  background: "var(--bg-page)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: 500,
                                }}
                              >
                                {index + 1}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{op.name}</div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {op.description || `ID: ${op.code}`}
                              </Text>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className="badge badge-primary">
                                {op.standardQuantity || "—"} sp/giờ
                              </span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <Rate
                                disabled
                                value={op.difficulty || 3}
                                count={5}
                                style={{ fontSize: 14 }}
                              />
                              <Text
                                type="secondary"
                                style={{ marginLeft: 8, fontSize: 12 }}
                              >
                                ({op.difficulty?.toFixed(1) || "3.0"})
                              </Text>
                            </td>
                            <td>
                              <Button
                                type="text"
                                icon={<SettingOutlined />}
                                onClick={() => openOperationModal(op)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination */}
                {operations.length > 0 && (
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
                      Hiển thị {operations.length} / {operations.length} thao
                      tác
                    </Text>
                    <Space>
                      <Button disabled>Trước</Button>
                      <Button disabled>Sau</Button>
                    </Space>
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 400,
                }}
              >
                <Empty description="Chọn công đoạn để xem thao tác" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Process Modal */}
      <Modal
        title={editingProcess ? "Sửa công đoạn" : "Thêm công đoạn mới"}
        open={processModalOpen}
        onCancel={() => setProcessModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={processForm}
          layout="vertical"
          onFinish={handleProcessSubmit}
        >
          <Form.Item
            name="name"
            label="Tên công đoạn"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input placeholder="VD: Lắp khung" />
          </Form.Item>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Form.Item
              name="code"
              label="Mã"
              rules={[{ required: true, message: "Vui lòng nhập mã" }]}
            >
              <Input
                placeholder="VD: KHUNG"
                style={{ textTransform: "uppercase" }}
              />
            </Form.Item>
            <Form.Item
              name="order"
              label="Thứ tự"
              rules={[{ required: true, message: "Vui lòng nhập thứ tự" }]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setProcessModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{ background: "var(--primary)" }}
              >
                {editingProcess ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Operation Modal */}
      <Modal
        title={editingOperation ? "Sửa thao tác" : "Thêm thao tác mới"}
        open={operationModalOpen}
        onCancel={() => setOperationModalOpen(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form
          form={operationForm}
          layout="vertical"
          onFinish={handleOperationSubmit}
        >
          <Form.Item
            name="name"
            label="Tên thao tác"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input placeholder="VD: Hàn khung chính" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Mã"
            rules={[{ required: true, message: "Vui lòng nhập mã" }]}
          >
            <Input
              placeholder="VD: KHUNG-01"
              style={{ textTransform: "uppercase" }}
            />
          </Form.Item>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Form.Item name="difficulty" label="Độ khó (1-5)">
              <Rate count={5} />
            </Form.Item>
            <Form.Item name="maxWorkers" label="Số công nhân tối đa">
              <InputNumber min={1} max={10} style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <Form.Item name="allowTeamwork" valuePropName="checked">
            <Checkbox>Cho phép làm nhóm</Checkbox>
          </Form.Item>

          <div
            style={{
              background: "var(--bg-page)",
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Title level={5} style={{ margin: "0 0 12px 0" }}>
              📊 Tiêu chuẩn sản xuất
            </Title>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <Form.Item
                name="standardQuantity"
                label="SL tiêu chuẩn/Ca"
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="VD: 100"
                />
              </Form.Item>
              <Form.Item
                name="standardMinutes"
                label="Phút/Sản phẩm"
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  min={0}
                  step={0.1}
                  style={{ width: "100%" }}
                  placeholder="Tự tính"
                />
              </Form.Item>
            </div>
            <Text
              type="secondary"
              style={{ fontSize: 12, marginTop: 8, display: "block" }}
            >
              💡 Nhập một giá trị, giá trị còn lại sẽ được tính (dựa trên 480
              phút/ca)
            </Text>
          </div>

          <Form.Item name="instructions" label="Hướng dẫn chi tiết">
            <Input.TextArea
              rows={2}
              placeholder="Hướng dẫn từng bước cho thao tác này..."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setOperationModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{ background: "var(--success)" }}
              >
                {editingOperation ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
