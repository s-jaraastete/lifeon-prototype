import { Tabs } from "expo-router";
import { Platform } from "react-native";
import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { OrgLogoHeader } from "@/components/OrgLogoHeader";
import { useDeviceLayout } from "@/context/DeviceLayoutContext";
import { colors } from "@/theme/tokens";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export default function AppTabsLayout() {
  const layout = useDeviceLayout();
  const tabBarCoreHeight = 56;
  const frameTabExtra = layout.mode === "desktop-frame" ? 28 : 0;
  const tabBarHeight = tabBarCoreHeight + layout.tabBarBottomInset + frameTabExtra;
  const headerHeight = 44 + layout.headerTopInset;
  const titleMaxWidth = Math.max(120, layout.viewportWidth - layout.logoSize - 56);

  const tabIcon = (name: IoniconName, focused: boolean) => (
    <Ionicons
      name={name}
      size={layout.tabIconSize}
      color={focused ? colors.secondary : colors.textSecondary}
    />
  );

  const documentsLabel = layout.viewportWidth < 360 ? "Docs" : "Documentos";

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          height: headerHeight,
        },
        headerStatusBarHeight: layout.headerTopInset,
        headerShadowVisible: false,
        headerTitleAlign: "left",
        headerTitleStyle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: layout.headerTitleFontSize,
          color: colors.text,
        },
        headerTitleContainerStyle: {
          maxWidth: titleMaxWidth,
        },
        headerRight: () => <OrgLogoHeader />,
        headerRightContainerStyle: {
          paddingRight: 6,
          flexShrink: 0,
        },
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarAllowFontScaling: true,
        tabBarLabelStyle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: layout.tabLabelFontSize,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          minHeight: tabBarHeight,
          height: tabBarHeight,
          paddingTop: 2,
          paddingBottom: layout.tabBarBottomInset + frameTabExtra,
          ...(Platform.OS === "web"
            ? { boxShadow: "0 -4px 24px rgba(32,33,36,0.06)" as unknown as undefined }
            : {}),
        },
        tabBarItemStyle: {
          minHeight: tabBarCoreHeight,
          justifyContent: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarLabel: "Inicio",
          tabBarIcon: ({ focused }) => tabIcon(focused ? "home" : "home-outline", focused),
        }}
      />
      <Tabs.Screen
        name="irl/index"
        options={{
          title: "Mi IRL",
          tabBarLabel: "Mi IRL",
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? "shield-checkmark" : "shield-checkmark-outline", focused),
        }}
      />
      <Tabs.Screen name="irl/[matrixId]" options={{ href: null, title: "IRL" }} />
      <Tabs.Screen
        name="documents/index"
        options={{
          title: "Documentos",
          tabBarLabel: documentsLabel,
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? "document-text" : "document-text-outline", focused),
        }}
      />
      <Tabs.Screen name="documents/[id]" options={{ href: null, title: "Documento" }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Mi perfil",
          tabBarLabel: "Perfil",
          tabBarIcon: ({ focused }) => tabIcon(focused ? "person" : "person-outline", focused),
        }}
      />
    </Tabs>
  );
}
