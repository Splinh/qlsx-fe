import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Statistic, Typography, Spin } from "antd";
import {
  CarOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import * as api from "../../services/api";

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    vehicleTypes: 0,
    activeOrder: null,
    todayRegistrations: 0,
    completedRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [vehicleTypesRes, activeOrderRes, registrationsRes] =
        await Promise.all([
          api.getVehicleTypes({ active: true }),
          api.getActiveProductionOrder(),
          api.getAllRegistrations({
            date: new Date().toISOString().split("T")[0],
          }),
        ]);

      const regs = registrationsRes.data.data || [];
      const completed = regs.filter((r) => r.status === "completed").length;

      setStats({
        vehicleTypes: vehicleTypesRes.data.count || 0,
        activeOrder: activeOrderRes.data.data,
        todayRegistrations: registrationsRes.data.count || 0,
        completedRegistrations: completed,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={3}>📊 Dashboard</Title>
      <Text type="secondary">
        Xin chào, {user?.name}! Đây là tổng quan hệ thống hôm nay.
      </Text>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <Statistic
              title={
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>Loại xe</Text>
              }
              value={stats.vehicleTypes}
              prefix={<CarOutlined />}
              valueStyle={{ color: "white", fontSize: 28 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            }}
          >
            <Statistic
              title={
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  Lệnh SX Active
                </Text>
              }
              value={
                stats.activeOrder ? stats.activeOrder.orderCode : "Không có"
              }
              prefix={<FileTextOutlined />}
              valueStyle={{
                color: "white",
                fontSize: stats.activeOrder ? 20 : 16,
              }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            }}
          >
            <Statistic
              title={
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  Đăng ký hôm nay
                </Text>
              }
              value={stats.todayRegistrations}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "white", fontSize: 28 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            }}
          >
            <Statistic
              title={
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  Đã hoàn thành
                </Text>
              }
              value={stats.completedRegistrations}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "white", fontSize: 28 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Active Order Details */}
      {stats.activeOrder && (
        <Card style={{ marginTop: 24 }}>
          <Title level={4}>📋 Lệnh sản xuất đang thực hiện</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Text type="secondary">Mã lệnh</Text>
              <Title level={4} style={{ margin: 0 }}>
                {stats.activeOrder.orderCode}
              </Title>
            </Col>
            <Col span={8}>
              <Text type="secondary">Loại xe</Text>
              <Title level={4} style={{ margin: 0 }}>
                {stats.activeOrder.vehicleTypeId?.name}
              </Title>
            </Col>
            <Col span={8}>
              <Text type="secondary">Số lượng</Text>
              <Title level={4} style={{ margin: 0 }}>
                {stats.activeOrder.quantity}
              </Title>
            </Col>
          </Row>
        </Card>
      )}

      {/* Quick Stats */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="⚡ Thao tác nhanh" bordered={false}>
            <p>
              • Vào <strong>Lệnh sản xuất</strong> để tạo/kích hoạt lệnh mới
            </p>
            <p>
              • Xem <strong>Đăng ký công</strong> để theo dõi tiến độ công nhân
            </p>
            <p>
              • Cài đặt <strong>Định mức</strong> cho thao tác mới
            </p>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="📈 Tiến độ hôm nay" bordered={false}>
            <p>
              Tổng đăng ký: <strong>{stats.todayRegistrations}</strong>
            </p>
            <p>
              Đã hoàn thành: <strong>{stats.completedRegistrations}</strong> (
              {stats.todayRegistrations > 0
                ? Math.round(
                    (stats.completedRegistrations / stats.todayRegistrations) *
                      100,
                  )
                : 0}
              %)
            </p>
            <p>
              Đang thực hiện:{" "}
              <strong>
                {stats.todayRegistrations - stats.completedRegistrations}
              </strong>
            </p>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
