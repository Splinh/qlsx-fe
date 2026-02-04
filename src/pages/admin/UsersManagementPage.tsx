import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  message,
  Popconfirm,
  Typography,
  Card,
  List,
  Row,
  Col,
  Switch,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import * as api from "../../services/api";

const { Title, Text } = Typography;

export default function UsersManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      setUsers(res.data.data);
    } catch (error) {
      message.error("Lỗi tải danh sách: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await api.updateUser(editingUser._id, values);
        message.success("Đã cập nhật người dùng!");
      } else {
        await api.createUser(values);
        message.success("Đã tạo người dùng mới!");
      }
      setModalVisible(false);
      form.resetFields();
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      message.error(
        "Lỗi: " + (error.response?.data?.error?.message || error.message),
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteUser(id);
      message.success("Đã xóa người dùng!");
      loadUsers();
    } catch (error) {
      message.error(
        "Lỗi: " + (error.response?.data?.error?.message || error.message),
      );
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      code: user.code,
      role: user.role,
      department: user.department,
      active: user.active,
    });
    setModalVisible(true);
  };

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const getRoleTag = (role) => {
    const map = {
      admin: { color: "red", text: "Admin" },
      supervisor: { color: "blue", text: "Giám sát" },
      worker: { color: "green", text: "Công nhân" },
    };
    const info = map[role] || { color: "default", text: role };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      width: 100,
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => getRoleTag(role),
    },
    {
      title: "Phòng ban",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (active) => (
        <Tag color={active ? "green" : "default"}>
          {active ? "Hoạt động" : "Khóa"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => navigate(`/admin/users/${record._id}/history`)}
          >
            Lịch sử
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Xóa người dùng này?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const MobileView = () => (
    <List
      dataSource={users}
      renderItem={(user) => (
        <List.Item>
          <Card size="small" style={{ width: "100%" }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Text strong>{user.code}</Text>
                <Text style={{ marginLeft: 8 }}>{user.name}</Text>
              </Col>
              <Col>{getRoleTag(user.role)}</Col>
            </Row>
            <Row justify="space-between" style={{ marginTop: 8 }}>
              <Text type="secondary">{user.department || "-"}</Text>
              <Tag color={user.active ? "green" : "default"}>
                {user.active ? "Hoạt động" : "Khóa"}
              </Tag>
            </Row>
            <Row justify="end" style={{ marginTop: 8 }}>
              <Space>
                <Button
                  size="small"
                  icon={<HistoryOutlined />}
                  onClick={() => navigate(`/admin/users/${user._id}/history`)}
                />
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEdit(user)}
                />
                <Popconfirm
                  title="Xóa người dùng này?"
                  onConfirm={() => handleDelete(user._id)}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            </Row>
          </Card>
        </List.Item>
      )}
    />
  );

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Quản lý người dùng
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm mới
        </Button>
      </Row>

      {isMobile ? (
        <MobileView />
      ) : (
        <Table
          dataSource={users}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      )}

      <Modal
        title={editingUser ? "Sửa người dùng" : "Thêm người dùng"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="code"
            label="Mã nhân viên"
            rules={[{ required: true, message: "Nhập mã nhân viên" }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            name="name"
            label="Họ tên"
            rules={[{ required: true, message: "Nhập họ tên" }]}
          >
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: "Nhập mật khẩu" }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          {editingUser && (
            <Form.Item
              name="password"
              label="Mật khẩu mới (để trống nếu không đổi)"
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: "Chọn vai trò" }]}
          >
            <Select>
              <Select.Option value="worker">Công nhân</Select.Option>
              <Select.Option value="supervisor">Giám sát</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="department" label="Phòng ban">
            <Input />
          </Form.Item>
          {editingUser && (
            <Form.Item name="active" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Khóa" />
            </Form.Item>
          )}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? "Cập nhật" : "Tạo mới"}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingUser(null);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
