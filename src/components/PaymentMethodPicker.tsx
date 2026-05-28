import { Pressable, StyleSheet, Text, View } from 'react-native';

import { estate } from '../theme/estate';
import { PAYMENT_METHODS, type PaymentMethod } from '../types';

const ICON_BG: Record<PaymentMethod, string> = {
  debit_card: estate.navy,
  mobile_transfer: '#0D9488',
  bank_transfer: estate.goldBg,
  cash: estate.accentBg,
};

type Props = {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
};

export function PaymentMethodPicker({ value, onChange, disabled }: Props) {
  return (
    <View style={s.list}>
      {PAYMENT_METHODS.map(m => {
        const selected = value === m.value;
        return (
          <Pressable
            key={m.value}
            style={[s.row, selected && s.rowSelected, disabled && s.rowDisabled]}
            onPress={() => onChange(m.value)}
            disabled={disabled}
          >
            <View
              style={[
                s.iconWrap,
                { backgroundColor: ICON_BG[m.value] },
                selected && s.iconWrapSelected,
              ]}
            >
              <Text style={s.icon}>{m.icon}</Text>
            </View>
            <View style={s.labelBlock}>
              <Text style={[s.label, selected && s.labelSelected]}>{m.label}</Text>
              {m.hint ? <Text style={s.hint}>{m.hint}</Text> : null}
            </View>
            <View style={[s.radio, selected && s.radioSelected]}>
              {selected ? <View style={s.radioDot} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: estate.border,
    backgroundColor: estate.surface,
  },
  rowSelected: {
    borderColor: estate.accent,
    backgroundColor: estate.accentBg,
  },
  rowDisabled: { opacity: 0.55 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapSelected: {
    borderWidth: 2,
    borderColor: estate.accent,
  },
  icon: { fontSize: 22 },
  labelBlock: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: estate.text },
  labelSelected: { color: estate.navy, fontWeight: '700' },
  hint: { fontSize: 12, color: estate.sub, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: estate.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioSelected: { borderColor: estate.accent },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: estate.accent,
  },
});
