export interface DefaultCategoryDefinition {
  name: string;
  icon: string;
  type: 'entrada' | 'gasto' | 'ambos';
  color: string;
}

export const defaultCategories: DefaultCategoryDefinition[] = [
  { name: 'Estudo', icon: 'book-open', type: 'gasto', color: '#7bd0ff' },
  { name: 'Transporte', icon: 'bus', type: 'gasto', color: '#ffba79' },
  { name: 'Lazer', icon: 'gamepad-2', type: 'gasto', color: '#fdb878' },
  { name: 'iFood', icon: 'utensils', type: 'gasto', color: '#ffb4ab' },
  { name: 'Mercado', icon: 'shopping-cart', type: 'gasto', color: '#75ff9e' },
  { name: 'Casa', icon: 'home', type: 'gasto', color: '#bacbb9' },
  { name: 'Saude', icon: 'heart-pulse', type: 'gasto', color: '#ffdad6' },
  { name: 'Assinaturas', icon: 'repeat', type: 'gasto', color: '#c4e7ff' },
  { name: 'Compras', icon: 'shopping-bag', type: 'gasto', color: '#ffdcbf' },
  { name: 'Outros', icon: 'tag', type: 'ambos', color: '#859585' },
  { name: 'Salario', icon: 'briefcase', type: 'entrada', color: '#75ff9e' },
  { name: 'Freela', icon: 'laptop', type: 'entrada', color: '#7bd0ff' },
  { name: 'Rendimentos', icon: 'trending-up', type: 'entrada', color: '#00e676' },
  { name: 'Reembolso', icon: 'receipt', type: 'entrada', color: '#ffba79' },
  { name: 'Outros recebimentos', icon: 'plus-circle', type: 'entrada', color: '#859585' },
];
