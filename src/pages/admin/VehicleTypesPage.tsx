import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  Space,
  message,
  Popconfirm,
  Typography,
  Card,
  List,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import * as api from "../../services/api";

const { Title, Text } = Typography;

export default function VehicleTypesPage() {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadVehicleTypes();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadVehicleTypes = async () => {
    try {
      const res = await api.getVehicleTypes();
      setVehicleTypes(res.data.data || []);
    } catch (err) {
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingId) {
        await api.updateVehicleType(editingId, values);
        message.success("Cập nhật thành công");
      } else {
        await api.createVehicleType(values);
        message.success("Thêm thành công");
      }
      setModalOpen(false);
      setEditingId(null);
      form.resetFields();
      loadVehicleTypes();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleEdit = (record) => {
    form.setFieldsValue(record);
    setEditingId(record._id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteVehicleType(id);
      message.success("Xóa thành công");
      loadVehicleTypes();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setEditingId(null);
    setModalOpen(true);
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      render: (text) => (
        <strong style={{ fontFamily: "monospace" }}>{text}</strong>
      ),
    },
    {
      title: "Tên loại xe",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Prefix Khung",
      dataIndex: "framePrefix",
      key: "framePrefix",
      render: (text) => text || <Text type="secondary">-</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (active) => (
        <Tag color={active ? "success" : "error"}>
          {active ? "Hoạt động" : "Tắt"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Mobile Card View
  const MobileView = () => (
    <List
      dataSource={vehicleTypes}
      loading={loading}
      renderItem={(vt) => (
        <Card size="small" style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <Text strong style={{ fontSize: 16, fontFamily: "monospace" }}>
                {vt.code}
              </Text>
              <div style={{ fontSize: 14 }}>{vt.name}</div>
              {vt.framePrefix && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Khung: {vt.framePrefix}
                </Text>
              )}
            </div>
            <Tag color={vt.active ? "success" : "error"}>
              {vt.active ? "On" : "Off"}
            </Tag>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(vt)}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Xóa loại xe này?"
              onConfirm={() => handleDelete(vt._id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          </div>
        </Card>
      )}
    />
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          🚗 Loại Xe
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm
        </Button>
      </div>

      {isMobile ? (
        <MobileView />
      ) : (
        <Table
          columns={columns}
          dataSource={vehicleTypes}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      )}

      <Modal
        title={editingId ? "Sửa Loại Xe" : "Thêm Loại Xe"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          preserve={false}
        >
          <Form.Item
            name="name"
            label="Tên loại xe"
            rules={[{ required: true, message: "Vui lòng nhập" }]}
          >
            <Input placeholder="VD: Wave Alpha" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Mã loại xe"
            rules={[{ required: true, message: "Vui lòng nhập" }]}
          >
            <Input
              placeholder="VD: WAVE-A"
              style={{ textTransform: "uppercase" }}
              disabled={!!editingId}
            />
          </Form.Item>
          <Form.Item name="framePrefix" label="Prefix số khung">
            <Input placeholder="VD: XDD-A1-" />
          </Form.Item>
          <Form.Item name="enginePrefix" label="Prefix số động cơ">
            <Input placeholder="VD: DC-A1-" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingId ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
