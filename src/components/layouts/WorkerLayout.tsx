import { useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Typography,
  theme,
  Drawer,
  Button,
} from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  CheckCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

interface WorkerLayoutProps {
  children: ReactNode;
}

export default function WorkerLayout({ children }: WorkerLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const menuItems: MenuItem[] = [
    { key: "/worker", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/summary", icon: <CheckCircleOutlined />, label: "Tổng kết ngày" },
    {
      key: "/worker/salary",
      icon: <WalletOutlined />,
      label: "Lương & Thưởng",
    },
  ];

  // Admin/Supervisor có thêm link đến trang admin
  if (user?.role === "admin" || user?.role === "supervisor") {
    menuItems.push({ type: "divider" });
    menuItems.push({
      key: "/admin",
      icon: <SettingOutlined />,
      label: "Quản trị",
    });
  }

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    navigate(key);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userMenuItems: MenuItem[] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: `${user?.name} (${user?.code})`,
      disabled: true,
    },
    {
      key: "role",
      label: `Vai trò: ${user?.role === "worker" ? "Công nhân" : user?.role === "admin" ? "Quản trị" : "Giám sát"}`,
      disabled: true,
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  const siderWidth = 200;

  const MenuContent = () => (
    <>
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.1)",
        }}
      >
        <Text
          strong
          style={{ color: "white", fontSize: collapsed && !isMobile ? 14 : 16 }}
        >
          {collapsed && !isMobile ? "👷" : "👷 Công Nhân"}
        </Text>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ background: "transparent" }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop Sider */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={siderWidth}
          theme="dark"
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            background: "linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)",
          }}
        >
          <MenuContent />
        </Sider>
      )}

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        width={siderWidth}
        styles={{
          body: {
            padding: 0,
            background: "linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)",
          },
          header: { display: "none" },
        }}
      >
        <MenuContent />
      </Drawer>

      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : siderWidth,
          transition: "all 0.2s",
        }}
      >
        <Header
          style={{
            padding: "0 16px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              type="text"
              icon={
                isMobile ? (
                  <MenuOutlined />
                ) : collapsed ? (
                  <MenuUnfoldOutlined />
                ) : (
                  <MenuFoldOutlined />
                )
              }
              onClick={() =>
                isMobile ? setMobileOpen(true) : setCollapsed(!collapsed)
              }
              style={{ fontSize: 16, width: 48, height: 48 }}
            />
            {!isMobile && (
              <Text strong style={{ fontSize: 16 }}>
                🏭 Hệ Thống Quản Lý Sản Xuất
              </Text>
            )}
          </div>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Avatar
                style={{ backgroundColor: "#52c41a" }}
                icon={<UserOutlined />}
              />
              {!isMobile && <Text strong>{user?.name}</Text>}
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: isMobile ? 12 : 24,
            padding: isMobile ? 16 : 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
