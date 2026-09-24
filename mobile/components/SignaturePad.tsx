import React, { useRef, useState } from "react";
import { View, PanResponder, StyleSheet, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import { captureRef } from "react-native-view-shot";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors, radius, spacing } from "@/theme/tokens";

interface SignaturePadProps {
  onConfirm: (base64Png: string) => void;
}

export function SignaturePad({ onConfirm }: SignaturePadProps) {
  const padRef = useRef<View>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const currentPath = useRef<string>("");
  const [capturing, setCapturing] = useState(false);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setPaths((prev) => [...prev, currentPath.current]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setPaths((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = currentPath.current;
          return copy;
        });
      },
      onPanResponderRelease: () => {
        currentPath.current = "";
      },
    })
  ).current;

  const handleClear = () => {
    setPaths([]);
    currentPath.current = "";
  };

  const handleConfirm = async () => {
    if (paths.length === 0 || !padRef.current) return;
    setCapturing(true);
    try {
      const base64 = await captureRef(padRef, {
        format: "png",
        quality: 1,
        result: "base64",
      });
      onConfirm(`data:image/png;base64,${base64}`);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View>
      <Text style={styles.hint}>Dibuja tu firma con el dedo</Text>
      <View style={styles.padFrame}>
        <View ref={padRef} style={styles.padCapture} {...pan.panHandlers} collapsable={false}>
          <Svg height="100%" width="100%">
            {paths.map((d, i) => (
              <Path key={i} d={d} stroke={colors.text} strokeWidth={2.5} fill="none" />
            ))}
          </Svg>
        </View>
      </View>
      <View style={styles.actions}>
        <View style={styles.actionHalf}>
          <PrimaryButton label="Limpiar" variant="outline" onPress={handleClear} />
        </View>
        <View style={styles.actionHalf}>
          <PrimaryButton
            label="Confirmar firma"
            onPress={handleConfirm}
            disabled={paths.length === 0}
            loading={capturing}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  padFrame: {
    height: 180,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  padCapture: {
    flex: 1,
    backgroundColor: "transparent",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionHalf: {
    flex: 1,
  },
});
