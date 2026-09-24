import { Tabs } from "expo-router";
import { Platform } from "react-native";
import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";


import { AppBrandHeader } from "@/components/AppBrandHeader";

import { useTabBarBottomInset } from "@/hooks/useTabBarBottomInset";

import { colors, radius } from "@/theme/tokens";



type IoniconName = ComponentProps<typeof Ionicons>["name"];



function tabIcon(name: IoniconName, focused: boolean) {

  return (

    <Ionicons

      name={name}

      size={22}

      color={focused ? colors.secondary : colors.textSecondary}

    />

  );

}



export default function AppTabsLayout() {

  const tabBarBottom = useTabBarBottomInset();



  return (

    <Tabs

      screenOptions={{

        headerStyle: {

          backgroundColor: colors.surface,

          borderBottomWidth: 1,

          borderBottomColor: colors.border,

        },

        headerShadowVisible: false,

        headerTitle: () => <AppBrandHeader />,

        headerTitleAlign: "left",

        tabBarActiveTintColor: colors.secondary,

        tabBarInactiveTintColor: colors.textSecondary,

        tabBarLabelStyle: {

          fontFamily: "Poppins_600SemiBold",

          fontSize: 10,

          marginTop: 2,

        },

        tabBarStyle: {

          backgroundColor: colors.surface,

          borderTopColor: colors.border,

          borderTopWidth: 1,

          height: 56 + tabBarBottom,

          paddingTop: 6,

          paddingBottom: tabBarBottom,

          ...(Platform.OS === "web"

            ? { boxShadow: "0 -4px 24px rgba(32,33,36,0.06)" as unknown as undefined }

            : {}),

        },

        tabBarItemStyle: {

          paddingVertical: 2,

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

      <Tabs.Screen name="irl/[matrixId]" options={{ href: null, title: "Detalle IRL" }} />

      <Tabs.Screen

        name="documents/index"

        options={{

          title: "Documentos",

          tabBarLabel: "Documentos",

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

