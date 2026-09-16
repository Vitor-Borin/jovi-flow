import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import { useAcervo } from '../store/AcervoContext';
import { useFlow } from '../store/FlowContext';
import { TOQUE_MIN, colors, font, fontDado, radius, spacing } from '../theme';

type ItemFoto = {
  chave: string;
  uri: string;
  momento: number;
  hora: string;
  /** Foto de aula abre a aula. Foto solta, tirada fora do modo Aula, so amplia. */
  aulaId: string | null;
  titulo: string | null;
};

type Grupo = { rotulo: string; itens: ItemFoto[] };

const COLUNAS = 3;
const MS_DIA = 24 * 60 * 60 * 1000;

/** dd/mm/aaaa e hh:mm, como o acervo grava, viram um instante para ordenar. */
function instante(data: string, hora: string): number {
  const [dia, mes, ano] = data.split('/').map(Number);
  const [h, m] = hora.split(':').map(Number);
  if (!dia || !mes || !ano) return 0;
  return new Date(ano, mes - 1, dia, h ?? 0, m ?? 0).getTime();
}

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

function rotuloDoDia(momento: number): string {
  const d = new Date(momento);
  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
  const inicioDia = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (inicioDia === inicioHoje) return 'Hoje';
  if (inicioDia === inicioHoje - MS_DIA) return 'Ontem';
  return `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * A aba Fotos da galeria: tudo o que a camera tirou, na ordem em que foi tirado,
 * sem organizacao nenhuma. E o lugar onde a foto da lousa costuma se perder, e
 * por isso ela fica ao lado de Aulas: a mesma foto que aqui e so mais uma, la ja
 * esta na materia certa.
 */
export function PhotosScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { acervo } = useAcervo();
  const { fotosSoltas } = useFlow();
  const [ampliada, setAmpliada] = useState<ItemFoto | null>(null);

  const grupos = useMemo<Grupo[]>(() => {
    const itens: ItemFoto[] = [];

    for (const aula of acervo.aulas) {
      aula.paginas.forEach((pagina, indice) => {
        if (pagina.fotoUri === null) return;
        itens.push({
          chave: pagina.id,
          // Na galeria a foto aparece como a camera tirou; a tratada mora na aula.
          uri: pagina.fotoOriginalUri ?? pagina.fotoUri,
          // O indice desempata paginas tiradas no mesmo minuto.
          momento: instante(aula.data, pagina.hora) + indice,
          hora: pagina.hora,
          aulaId: aula.id,
          titulo: aula.titulo,
        });
      });
    }

    for (const foto of fotosSoltas) {
      const d = new Date(foto.tiradaEm);
      itens.push({
        chave: `solta-${foto.tiradaEm}`,
        uri: foto.uri,
        momento: foto.tiradaEm,
        hora: `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`,
        aulaId: null,
        titulo: null,
      });
    }

    itens.sort((a, b) => b.momento - a.momento);

    const resultado: Grupo[] = [];
    for (const item of itens) {
      const rotulo = rotuloDoDia(item.momento);
      const ultimo = resultado[resultado.length - 1];
      if (ultimo && ultimo.rotulo === rotulo) ultimo.itens.push(item);
      else resultado.push({ rotulo, itens: [item] });
    }
    return resultado;
  }, [acervo.aulas, fotosSoltas]);

  const vao = spacing(0.5);
  const lado = Math.floor((width - vao * (COLUNAS - 1)) / COLUNAS);

  return (
    <View style={styles.tela}>
      <ScreenHeader title="Fotos" onBack={() => navigation.navigate('Camera')} />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing(6) }}>
        {grupos.length === 0 ? (
          <View style={styles.vazio}>
            <MaterialCommunityIcons name="image-multiple-outline" size={32} color={colors.textFaint} />
            <Text style={styles.textoVazio}>
              Nenhuma foto ainda. O que a câmera fotografar aparece aqui, na ordem em que foi
              tirado.
            </Text>
          </View>
        ) : (
          grupos.map((grupo) => (
            <View key={grupo.rotulo}>
              <Text style={styles.rotuloDia}>{grupo.rotulo}</Text>
              <View style={[styles.grade, { gap: vao }]}>
                {grupo.itens.map((item) => (
                  <Pressable
                    key={item.chave}
                    onPress={() =>
                      item.aulaId !== null
                        ? navigation.navigate('Aula', { aulaId: item.aulaId })
                        : setAmpliada(item)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                      item.titulo !== null
                        ? `Foto de ${item.titulo}, ${item.hora}. Abrir a aula`
                        : `Foto das ${item.hora}. Ampliar`
                    }
                    style={({ pressed }) => [
                      { width: lado, height: lado },
                      pressed && styles.pressionado,
                    ]}
                  >
                    <Image source={{ uri: item.uri }} style={styles.imagem} resizeMode="cover" />
                    {item.aulaId !== null ? (
                      // O selo diz que esta foto ja virou aula, sem precisar abrir.
                      <View style={styles.selo}>
                        <Ionicons name="school" size={12} color={colors.visor.icone} />
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={ampliada !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAmpliada(null)}
      >
        <Pressable
          style={styles.fundoAmpliada}
          onPress={() => setAmpliada(null)}
          accessibilityRole="button"
          accessibilityLabel="Fechar a foto"
        >
          {ampliada ? (
            <Image source={{ uri: ampliada.uri }} style={styles.imagemAmpliada} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  rotuloDia: {
    ...fontDado.rotulo,
    color: colors.textDim,
    paddingHorizontal: spacing(4),
    paddingTop: spacing(5),
    paddingBottom: spacing(2),
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imagem: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
  selo: {
    position: 'absolute',
    right: spacing(1.5),
    bottom: spacing(1.5),
    width: spacing(5.5),
    height: spacing(5.5),
    borderRadius: radius.pill,
    backgroundColor: colors.visor.veu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressionado: {
    opacity: 0.7,
  },
  vazio: {
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(10),
    paddingTop: spacing(20),
    minHeight: TOQUE_MIN,
  },
  textoVazio: {
    ...font.small,
    color: colors.textFaint,
    textAlign: 'center',
    lineHeight: 18,
  },
  fundoAmpliada: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
  },
  imagemAmpliada: {
    width: '100%',
    height: '80%',
  },
});
