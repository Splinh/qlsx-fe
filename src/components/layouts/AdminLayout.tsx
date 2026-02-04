import { useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Typography,
  theme,
  Drawer,
} from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  CarOutlined,
  ApartmentOutlined,
  ToolOutlined,
  BarChartOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

const menuItems: MenuItem[] = [
  { key: "/admin", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/admin/vehicle-types", icon: <CarOutlined />, label: "Loại xe" },
  {
    key: "/admin/processes",
    icon: <ApartmentOutlined />,
    label: "Công đoạn & Thao tác",
  },
  {
    key: "/admin/standards",
    icon: <BarChartOutlined />,
    label: "Định mức sản xuất",
  },
  { key: "/admin/orders", icon: <FileTextOutlined />, label: "Lệnh sản xuất" },
  {
    key: "/admin/registrations",
    icon: <ToolOutlined />,
    label: "Đăng ký công",
  },
  { key: "/admin/users", icon: <UserOutlined />, label: "Quản lý người dùng" },
  { type: "divider" },
  { key: "/worker", icon: <TeamOutlined />, label: "Giao diện Công nhân" },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: handleLogout,
    },
  ];

  const siderWidth = 220;

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
          {collapsed && !isMobile ? "🏭" : "🏭 Quản Lý SX"}
        </Text>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
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
          body: { padding: 0, background: "#001529" },
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
                style={{ backgroundColor: "#1677ff" }}
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
