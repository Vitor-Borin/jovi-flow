import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GhostButton } from './GhostButton';
import { PrimaryButton } from './PrimaryButton';
import { colors, font, radius, spacing } from '../theme';

type Props = {
  aberto: boolean;
  titulo: string;
  /** Texto de apoio abaixo do titulo. */
  descricao?: string;
  placeholder: string;
  valorInicial?: string;
  rotuloConfirmar: string;
  /** Mensagem mostrada quando a confirmacao devolve false (nome repetido, por exemplo). */
  erro?: string;
  onConfirmar: (valor: string) => boolean;
  onFechar: () => void;
};

/**
 * Folha com um campo de texto: criar pasta, renomear pasta, renomear aula.
 * Existe porque Alert.prompt so funciona no iOS, e o app precisa criar e
 * renomear no Android tambem.
 */
export function ModalTexto({
  aberto,
  titulo,
  descricao,
  placeholder,
  valorInicial = '',
  rotuloConfirmar,
  erro = 'Esse nome já existe.',
  onConfirmar,
  onFechar,
}: Props) {
  const insets = useSafeAreaInsets();
  const [valor, setValor] = useState(valorInicial);
  const [falhou, setFalhou] = useState(false);

  // Recarrega a cada abertura, para nao guardar edicao descartada.
  useEffect(() => {
    if (aberto) {
      setValor(valorInicial);
      setFalhou(false);
    }
  }, [aberto, valorInicial]);

  const confirmar = () => {
    if (valor.trim() === '') return;
    if (onConfirmar(valor)) {
      onFechar();
    } else {
      setFalhou(true);
    }
  };

  return (
    <Modal visible={aberto} animationType="fade" transparent onRequestClose={onFechar}>
      <View style={styles.camada}>
        <Pressable
          style={styles.scrim}
          onPress={onFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />
        <View style={[styles.folha, { marginBottom: insets.bottom + spacing(6) }]}>
          <Text style={styles.titulo}>{titulo}</Text>
          {descricao ? <Text style={styles.descricao}>{descricao}</Text> : null}

          <TextInput
            value={valor}
            onChangeText={(t) => {
              setValor(t);
              setFalhou(false);
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.textFaint}
            autoFocus
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={confirmar}
            style={[styles.campo, falhou && styles.campoErro]}
            accessibilityLabel={placeholder}
          />
          {falhou ? <Text style={styles.textoErro}>{erro}</Text> : null}

          <PrimaryButton
            label={rotuloConfirmar}
            onPress={confirmar}
            disabled={valor.trim() === ''}
            style={styles.botao}
          />
          <GhostButton label="Cancelar" variant="text" onPress={onFechar} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  camada: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing(4),
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrim,
  },
  folha: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(5),
  },
  titulo: {
    ...font.h3,
    color: colors.text,
  },
  descricao: {
    ...font.small,
    color: colors.textDim,
    marginTop: spacing(1.5),
    lineHeight: 17,
  },
  campo: {
    marginTop: spacing(4),
    height: spacing(12),
    paddingHorizontal: spacing(3.5),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElev,
    ...font.body,
    color: colors.text,
  },
  campoErro: {
    borderColor: colors.danger,
  },
  textoErro: {
    ...font.small,
    color: colors.danger,
    marginTop: spacing(2),
  },
  botao: {
    marginTop: spacing(4),
  },
});
