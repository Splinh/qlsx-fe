import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Typography,
  Space,
  Button,
  Spin,
  Descriptions,
  Statistic,
  Row,
  Col,
  Tag,
  DatePicker,
  List,
  Divider,
} from "antd";
import { ArrowLeftOutlined, FilterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import * as api from "../../services/api";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function UserWorkHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      const res = await api.getUserWorkHistory(id, params);
      setData(res.data.data);
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
    } finally {
      setLoading(false);
    }
  }, [id, dateRange]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getStatusTag = (status) => {
    const map = {
      registered: { color: "blue", text: "Đăng ký" },
      in_progress: { color: "processing", text: "Đang làm" },
      completed: { color: "success", text: "Hoàn thành" },
      reassigned: { color: "orange", text: "Chuyển" },
    };
    const info = map[status] || { color: "default", text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const formatMinutes = (minutes) => {
    if (!minutes) return "0 phút";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} phút`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);
  };

  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      width: 100,
    },
    {
      title: "Lệnh SX",
      key: "order",
      render: (_, record) => record.productionOrderId?.orderCode,
    },
    {
      title: "Thao tác",
      key: "operation",
      render: (_, record) => {
        const op = record.operationId;
        return op?.name;
      },
    },
    {
      title: "SL kỳ vọng",
      dataIndex: "expectedQuantity",
      key: "expectedQuantity",
      align: "right",
      width: 90,
    },
    {
      title: "SL thực",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
      align: "right",
      width: 90,
    },
    {
      title: "Chênh lệch",
      dataIndex: "deviation",
      key: "deviation",
      align: "right",
      width: 90,
      render: (val) => (
        <Text type={val > 0 ? "success" : val < 0 ? "danger" : undefined}>
          {val > 0 ? `+${val}` : val}
        </Text>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "workingMinutes",
      key: "workingMinutes",
      render: (val) => formatMinutes(val),
      align: "right",
      width: 90,
    },
    {
      title: "Thưởng/Phạt",
      key: "bonusPenalty",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.bonusAmount > 0 && (
            <Text type="success">+{formatCurrency(record.bonusAmount)}</Text>
          )}
          {record.penaltyAmount > 0 && (
            <Text type="danger">-{formatCurrency(record.penaltyAmount)}</Text>
          )}
        </Space>
      ),
      width: 120,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Space>
          {getStatusTag(status)}
          {record.isReplacement && <Tag color="purple">Bổ sung</Tag>}
        </Space>
      ),
      width: 140,
    },
  ];

  const MobileView = () => (
    <List
      dataSource={data?.registrations || []}
      renderItem={(item) => (
        <List.Item>
          <Card size="small" style={{ width: "100%" }}>
            <Row justify="space-between" align="middle">
              <Text strong>{dayjs(item.date).format("DD/MM/YYYY")}</Text>
              {getStatusTag(item.status)}
            </Row>
            <Text type="secondary" style={{ display: "block" }}>
              {item.productionOrderId?.orderCode} - {item.operationId?.name}
            </Text>
            <Row justify="space-between" style={{ marginTop: 8 }}>
              <Text>
                SL: {item.actualQuantity}/{item.expectedQuantity}
              </Text>
              <Text
                type={
                  item.deviation > 0
                    ? "success"
                    : item.deviation < 0
                      ? "danger"
                      : undefined
                }
              >
                {item.deviation > 0 ? `+${item.deviation}` : item.deviation}
              </Text>
            </Row>
            <Row justify="space-between" style={{ marginTop: 4 }}>
              <Text>Giờ: {formatMinutes(item.workingMinutes)}</Text>
              <Space>
                {item.bonusAmount > 0 && (
                  <Text type="success">
                    +{formatCurrency(item.bonusAmount)}
                  </Text>
                )}
                {item.penaltyAmount > 0 && (
                  <Text type="danger">
                    -{formatCurrency(item.penaltyAmount)}
                  </Text>
                )}
              </Space>
            </Row>
          </Card>
        </List.Item>
      )}
    />
  );

  if (loading && !data) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  const { user, registrations, statistics } = data || {};

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </Space>

      <Card>
        <Descriptions
          title={
            <Title level={4} style={{ margin: 0 }}>
              Lịch sử làm việc: {user?.code} - {user?.name}
            </Title>
          }
          column={isMobile ? 1 : 3}
          size="small"
        >
          <Descriptions.Item label="Phòng ban">
            {user?.department || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">{user?.role}</Descriptions.Item>
        </Descriptions>
      </Card>

      {statistics && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Tổng đăng ký"
                value={statistics.totalRegistrations}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Hoàn thành"
                value={statistics.totalCompleted}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic title="Tổng SL" value={statistics.totalQuantity} />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Tổng giờ"
                value={formatMinutes(statistics.totalWorkingMinutes)}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Tổng thưởng"
                value={formatCurrency(statistics.totalBonus)}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card>
              <Statistic
                title="Tổng phạt"
                value={formatCurrency(statistics.totalPenalty)}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Divider />

      <Space style={{ marginBottom: 16 }} wrap>
        <RangePicker
          value={dateRange}
          onChange={setDateRange}
          format="DD/MM/YYYY"
          placeholder={["Từ ngày", "Đến ngày"]}
        />
        <Button
          icon={<FilterOutlined />}
          onClick={loadHistory}
          loading={loading}
        >
          Lọc
        </Button>
      </Space>

      {isMobile ? (
        <MobileView />
      ) : (
        <Table
          dataSource={registrations || []}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="small"
        />
      )}
    </div>
  );
}
