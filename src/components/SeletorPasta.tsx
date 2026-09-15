import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GhostButton } from './GhostButton';
import { PrimaryButton } from './PrimaryButton';
import { arvore, iconeDaMateria, mesmaPasta } from '../data/acervo';
import { useAcervo } from '../store/AcervoContext';
import { TOQUE_MIN, colors, font, radius, spacing } from '../theme';

type Props = {
  aberto: boolean;
  titulo: string;
  atual: [string, string] | null;
  /** Abre direto no formulario de pasta nova, sem a lista. */
  apenasCriar?: boolean;
  onEscolher: (pasta: [string, string]) => void;
  onFechar: () => void;
};

/**
 * Folha para escolher uma pasta do acervo ou criar uma nova na hora. Usada em
 * Organizar (destino da captura) e em Estudos e Aula (mover).
 *
 * Criar aqui e o que faltava na Sprint 3: o estudante so podia escolher entre
 * as pastas que ja existiam.
 */
export function SeletorPasta({
  aberto,
  titulo,
  atual,
  apenasCriar = false,
  onEscolher,
  onFechar,
}: Props) {
  const insets = useSafeAreaInsets();
  const { acervo, criarPasta } = useAcervo();
  const pastas = useMemo(() => arvore(acervo), [acervo]);

  const [criando, setCriando] = useState(apenasCriar);
  const [materia, setMateria] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const fechar = () => {
    setCriando(apenasCriar);
    setMateria('');
    setNome('');
    setErro(null);
    onFechar();
  };

  const confirmarNova = () => {
    const m = materia.trim();
    const n = nome.trim();
    if (m === '' || n === '') return;
    if (!criarPasta(m, n)) {
      setErro('Essa pasta já existe.');
      return;
    }
    onEscolher([m, n]);
    fechar();
  };

  return (
    <Modal visible={aberto} animationType="slide" transparent onRequestClose={fechar}>
      <View style={styles.camada}>
        <Pressable
          style={styles.scrim}
          onPress={fechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar a escolha de pasta"
        />

        <View style={[styles.folha, { paddingBottom: insets.bottom + spacing(6) }]}>
          <View style={styles.alca} />
          <Text style={styles.titulo}>{criando ? 'Nova pasta' : titulo}</Text>

          {criando ? (
            <View>
              <Text style={styles.rotuloCampo}>Matéria</Text>
              <TextInput
                value={materia}
                onChangeText={(t) => {
                  setMateria(t);
                  setErro(null);
                }}
                placeholder="Ex.: Design"
                placeholderTextColor={colors.textFaint}
                autoFocus
                autoCorrect={false}
                style={styles.campo}
                accessibilityLabel="Nome da matéria"
              />
              <Text style={styles.rotuloCampo}>Pasta</Text>
              <TextInput
                value={nome}
                onChangeText={(t) => {
                  setNome(t);
                  setErro(null);
                }}
                placeholder="Ex.: Front-End Design"
                placeholderTextColor={colors.textFaint}
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={confirmarNova}
                style={styles.campo}
                accessibilityLabel="Nome da pasta"
              />
              {erro ? <Text style={styles.erro}>{erro}</Text> : null}

              <PrimaryButton
                label="Criar e usar esta pasta"
                onPress={confirmarNova}
                disabled={materia.trim() === '' || nome.trim() === ''}
                style={styles.botaoCriar}
              />
              <GhostButton
                label={apenasCriar ? 'Cancelar' : 'Voltar'}
                variant="text"
                onPress={() => (apenasCriar ? fechar() : setCriando(false))}
              />
            </View>
          ) : (
            <>
              <ScrollView style={styles.lista}>
                {pastas.map((pasta) =>
                  pasta.subpastas.map((sub) => {
                    const caminho: [string, string] = [pasta.nome, sub.nome];
                    const selecionado = atual !== null && mesmaPasta(atual, caminho);
                    return (
                      <Pressable
                        key={`${pasta.nome}/${sub.nome}`}
                        onPress={() => {
                          onEscolher(caminho);
                          fechar();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`${pasta.nome}, ${sub.nome}`}
                        accessibilityState={{ selected: selecionado }}
                        style={({ pressed }) => [
                          styles.opcao,
                          selecionado && styles.opcaoSelecionada,
                          pressed && styles.opcaoPressionada,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={pasta.icone ?? iconeDaMateria(pasta.nome)}
                          size={20}
                          color={selecionado ? colors.primaryHi : colors.textDim}
                        />
                        <View style={styles.textosOpcao}>
                          <Text style={styles.opcaoTitulo} numberOfLines={1}>
                            {sub.nome}
                          </Text>
                          <Text style={styles.opcaoCaminho} numberOfLines={1}>
                            {pasta.nome} · {sub.aulas.length}{' '}
                            {sub.aulas.length === 1 ? 'aula' : 'aulas'}
                          </Text>
                        </View>
                        {selecionado ? (
                          <MaterialCommunityIcons name="check" size={20} color={colors.primaryHi} />
                        ) : null}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>

              <Pressable
                onPress={() => setCriando(true)}
                accessibilityRole="button"
                accessibilityLabel="Criar uma pasta nova"
                style={({ pressed }) => [styles.novaPasta, pressed && styles.opcaoPressionada]}
              >
                <MaterialCommunityIcons name="folder-plus-outline" size={20} color={colors.primaryHi} />
                <Text style={styles.textoNovaPasta}>Nova pasta</Text>
              </Pressable>

              <GhostButton label="Cancelar" variant="text" onPress={fechar} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  camada: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrim,
  },
  folha: {
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(5),
    paddingTop: spacing(3),
  },
  alca: {
    width: spacing(10),
    height: spacing(1),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
    alignSelf: 'center',
    marginBottom: spacing(5),
  },
  titulo: {
    ...font.h3,
    color: colors.text,
    marginBottom: spacing(4),
  },
  lista: {
    flexGrow: 0,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    minHeight: spacing(14),
    paddingHorizontal: spacing(3),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: spacing(2),
  },
  opcaoSelecionada: {
    borderColor: colors.primaryEdge,
    backgroundColor: colors.primarySoft,
  },
  opcaoPressionada: {
    backgroundColor: colors.surfaceAlt,
  },
  textosOpcao: {
    flex: 1,
  },
  opcaoTitulo: {
    ...font.bodyMed,
    color: colors.text,
  },
  opcaoCaminho: {
    ...font.small,
    color: colors.textFaint,
    marginTop: spacing(0.5),
  },
  novaPasta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    minHeight: TOQUE_MIN,
    paddingHorizontal: spacing(3),
    marginTop: spacing(1),
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primaryEdge,
  },
  textoNovaPasta: {
    ...font.bodyMed,
    color: colors.primaryHi,
  },
  rotuloCampo: {
    ...font.small,
    color: colors.textDim,
    marginTop: spacing(3),
    marginBottom: spacing(1.5),
  },
  campo: {
    height: spacing(12),
    paddingHorizontal: spacing(3.5),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElev,
    ...font.body,
    color: colors.text,
  },
  erro: {
    ...font.small,
    color: colors.danger,
    marginTop: spacing(2),
  },
  botaoCriar: {
    marginTop: spacing(5),
  },
});
