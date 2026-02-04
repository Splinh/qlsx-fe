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
  Collapse,
  List,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as api from "../../services/api";

const { Title, Text } = Typography;

export default function ProductionOrderReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getOrderReport(id);
      setReport(res.data.data);
    } catch (error) {
      console.error("Lỗi tải báo cáo:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const getStatusTag = (status) => {
    const map = {
      pending: { color: "default", text: "Chờ" },
      in_progress: { color: "processing", text: "Đang làm" },
      completed: { color: "success", text: "Hoàn thành" },
      registered: { color: "blue", text: "Đăng ký" },
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

  const workerColumns = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      width: 80,
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Số lượng",
      dataIndex: "totalQuantity",
      key: "totalQuantity",
      align: "right",
    },
    {
      title: "Thời gian",
      dataIndex: "totalMinutes",
      key: "totalMinutes",
      render: (val) => formatMinutes(val),
      align: "right",
    },
    {
      title: "Thưởng",
      dataIndex: "totalBonus",
      key: "totalBonus",
      render: (val) => <Text type="success">{formatCurrency(val)}</Text>,
      align: "right",
    },
    {
      title: "Phạt",
      dataIndex: "totalPenalty",
      key: "totalPenalty",
      render: (val) => <Text type="danger">{formatCurrency(val)}</Text>,
      align: "right",
    },
    {
      title: "Thao tác",
      dataIndex: "operations",
      key: "operations",
      align: "right",
    },
  ];

  const dailyColumns = [
    {
      title: "Công nhân",
      key: "worker",
      render: (_, record) => `${record.worker?.code} - ${record.worker?.name}`,
      width: 150,
    },
    {
      title: "Công đoạn",
      key: "process",
      render: (_, record) => record.process?.name,
    },
    {
      title: "Thao tác",
      key: "operation",
      render: (_, record) => record.operation?.name,
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
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
      width: 100,
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Text type="secondary">Không tìm thấy báo cáo</Text>
      </div>
    );
  }

  const { order, dailyReport, workerSummary, statistics } = report;

  return (
    <div style={{ padding: isMobile ? 12 : 24 }} className="print-container">
      <Space style={{ marginBottom: 16 }} className="no-print">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
        <Button icon={<PrinterOutlined />} onClick={handlePrint}>
          In báo cáo
        </Button>
      </Space>

      <Card>
        <Title level={4}>Báo cáo lệnh sản xuất: {order?.orderCode}</Title>
        <Descriptions bordered column={isMobile ? 1 : 3} size="small">
          <Descriptions.Item label="Loại xe">
            {order?.vehicleType?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Số lượng">
            {order?.quantity}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {getStatusTag(order?.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày bắt đầu">
            {dayjs(order?.startDate).format("DD/MM/YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày hoàn thành">
            {order?.actualEndDate
              ? dayjs(order?.actualEndDate).format("DD/MM/YYYY")
              : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Người tạo">
            {order?.createdBy?.name}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Tổng đăng ký"
              value={statistics?.totalRegistrations}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={statistics?.totalCompleted}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Tổng SL"
              value={statistics?.totalQuantityProduced}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Tổng giờ"
              value={formatMinutes(statistics?.totalWorkingMinutes)}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Tổng thưởng"
              value={formatCurrency(statistics?.totalBonus)}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Tổng phạt"
              value={formatCurrency(statistics?.totalPenalty)}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Title level={5}>Tổng hợp theo công nhân</Title>
      {isMobile ? (
        <List
          dataSource={workerSummary}
          renderItem={(item) => (
            <List.Item>
              <Card size="small" style={{ width: "100%" }}>
                <Row justify="space-between">
                  <Text strong>
                    {item.code} - {item.name}
                  </Text>
                  <Text>{item.operations} thao tác</Text>
                </Row>
                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <Text>SL: {item.totalQuantity}</Text>
                  <Text>Giờ: {formatMinutes(item.totalMinutes)}</Text>
                </Row>
                <Row justify="space-between" style={{ marginTop: 4 }}>
                  <Text type="success">+{formatCurrency(item.totalBonus)}</Text>
                  <Text type="danger">
                    -{formatCurrency(item.totalPenalty)}
                  </Text>
                </Row>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Table
          dataSource={workerSummary}
          columns={workerColumns}
          rowKey="code"
          pagination={false}
          size="small"
        />
      )}

      <Divider />

      <Title level={5}>Chi tiết theo ngày</Title>
      <Collapse
        items={Object.entries(dailyReport).map(([date, records]) => ({
          key: date,
          label: (
            <Space>
              <Text strong>{dayjs(date).format("DD/MM/YYYY")}</Text>
              <Tag>{records.length} đăng ký</Tag>
            </Space>
          ),
          children: isMobile ? (
            <List
              size="small"
              dataSource={records}
              renderItem={(item) => (
                <List.Item>
                  <Card size="small" style={{ width: "100%" }}>
                    <Row justify="space-between">
                      <Text strong>
                        {item.worker?.code} - {item.worker?.name}
                      </Text>
                      {getStatusTag(item.status)}
                    </Row>
                    <Text type="secondary" style={{ display: "block" }}>
                      {item.process?.name} → {item.operation?.name}
                    </Text>
                    <Row justify="space-between" style={{ marginTop: 8 }}>
                      <Text>
                        SL: {item.actualQuantity}/{item.expectedQuantity}
                      </Text>
                      <Text>Giờ: {formatMinutes(item.workingMinutes)}</Text>
                    </Row>
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <Table
              dataSource={records}
              columns={dailyColumns}
              rowKey={(r, i) => `${date}-${i}`}
              pagination={false}
              size="small"
            />
          ),
        }))}
      />

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
