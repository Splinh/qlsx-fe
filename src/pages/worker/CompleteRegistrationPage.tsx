import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Form,
  InputNumber,
  Input,
  Spin,
  Result,
  Typography,
  Divider,
  Alert,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  ArrowLeftOutlined,
  TrophyOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import * as api from "../../services/api";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CompleteRegistrationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [actualQuantity, setActualQuantity] = useState(null);

  useEffect(() => {
    loadRegistration();
  }, [id]);

  const loadRegistration = async () => {
    try {
      const res = await api.getTodayRegistrations();
      const reg = res.data.data?.find((r) => r._id === id);
      if (reg) {
        setRegistration(reg);
        if (reg.actualQuantity !== null) {
          form.setFieldsValue({
            actualQuantity: reg.actualQuantity,
            interruptionNote: reg.interruptionNote || "",
            interruptionMinutes: reg.interruptionMinutes || 0,
          });
          setActualQuantity(reg.actualQuantity);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await api.completeRegistration(id, {
        actualQuantity: values.actualQuantity,
        interruptionNote: values.interruptionNote || "",
        interruptionMinutes: values.interruptionMinutes || 0,
      });
      message.success("Đã lưu thành công!");
      navigate("/worker");
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
      setSubmitting(false);
    }
  };

  const calculateResult = () => {
    if (!registration || actualQuantity === null) return null;
    const expected =
      registration.adjustedExpectedQty || registration.expectedQuantity;
    const actual = actualQuantity;
    const deviation = actual - expected;
    return { expected, actual, deviation };
  };

  const result = calculateResult();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 300,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!registration) {
    return (
      <Result
        status="error"
        title="Không tìm thấy đăng ký"
        extra={
          <Button type="primary" onClick={() => navigate("/worker")}>
            Quay lại Dashboard
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/worker")}
        style={{ padding: 0, marginBottom: 16 }}
      >
        Quay lại Dashboard
      </Button>

      <Title level={3}>📝 Nhập Sản Lượng Cuối Ngày</Title>

      {/* Operation Info */}
      <Card style={{ marginBottom: 24 }}>
        <Text type="secondary">Thao tác</Text>
        <Title level={4} style={{ margin: "4px 0" }}>
          {registration.operationId?.name}
        </Title>
        <Text type="secondary">{registration.operationId?.code}</Text>

        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: "#e6f4ff",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <Text type="secondary">Sản lượng quy định</Text>
          <Title level={2} style={{ margin: "4px 0", color: "#1677ff" }}>
            {registration.adjustedExpectedQty || registration.expectedQuantity}
          </Title>
          {registration.adjustedExpectedQty && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              (Đã điều chỉnh từ {registration.expectedQuantity})
            </Text>
          )}
        </div>
      </Card>

      {/* Form */}
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="actualQuantity"
            label={
              <Text strong style={{ fontSize: 16 }}>
                Số lượng đã làm được *
              </Text>
            }
            rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
          >
            <InputNumber
              min={0}
              size="large"
              style={{ width: "100%", fontSize: 24, textAlign: "center" }}
              onChange={(val) => setActualQuantity(val)}
              autoFocus
            />
          </Form.Item>

          {/* Result Preview */}
          {result && (
            <Alert
              style={{ marginBottom: 24, textAlign: "center" }}
              type={
                result.deviation > 0
                  ? "success"
                  : result.deviation < 0
                    ? "error"
                    : "info"
              }
              icon={
                result.deviation > 0 ? (
                  <TrophyOutlined />
                ) : result.deviation < 0 ? (
                  <WarningOutlined />
                ) : (
                  <CheckCircleOutlined />
                )
              }
              showIcon
              message={
                result.deviation > 0
                  ? `🎉 Vượt ${result.deviation} sản phẩm!`
                  : result.deviation < 0
                    ? `⚠️ Thiếu ${Math.abs(result.deviation)} sản phẩm`
                    : `✅ Đạt đúng chỉ tiêu!`
              }
            />
          )}

          <Divider>Nếu có gián đoạn (tùy chọn)</Divider>

          <Form.Item
            name="interruptionMinutes"
            label="Thời gian gián đoạn (phút)"
          >
            <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
          </Form.Item>

          <Form.Item name="interruptionNote" label="Lý do gián đoạn">
            <TextArea
              rows={2}
              placeholder="VD: Chờ công đoạn trước, máy hỏng..."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              block
              size="large"
              icon={<CheckCircleOutlined />}
              style={{
                height: 50,
                fontSize: 16,
                background: "#52c41a",
                borderColor: "#52c41a",
              }}
            >
              Xác Nhận Hoàn Thành
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
