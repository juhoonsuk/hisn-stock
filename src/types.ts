/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EntryType = 'stock' | 'order';

export interface InventoryEntry {
  id: number;
  date: string;
  model: string;
  surface: string;
  size: string;
  brand: string;
  colorNo: string;
  area: number;
  boxes: number;
  type: EntryType;
  memo: string;
}

export interface Stats {
  totalBoxes: number;
  totalM2: number;
  kinds: number;
  lowStock: number;
}
