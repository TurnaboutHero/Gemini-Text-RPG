import React from 'react';
import { Character, Item, ItemSlot, StatEffect, ItemType } from '../types';
import { Plus, Minus, HelpCircle, Hand, Shield, Shirt, Sword, FlaskConical, Scroll, Package } from 'lucide-react';
import ItemTooltip from './ItemTooltip';

interface InventoryProps {
    character: Character;
    onEquipItem: (item: Item) => void;
    onUnequipItem: (slot: ItemSlot) => void;
}

const slotIcons: Record<ItemSlot, React.ReactNode> = {
    mainHand: <Hand />,
    offHand: <Shield />,
    armor: <Shirt />,
    none: <HelpCircle />,
};

const itemTypeIcons: Record<ItemType, React.ReactNode> = {
    weapon: <Sword size={16} className="text-red-400 group-hover:text-red-300 transition-colors" />,
    armor: <Shield size={16} className="text-blue-400 group-hover:text-blue-300 transition-colors" />,
    consumable: <FlaskConical size={16} className="text-green-400 group-hover:text-green-300 transition-colors" />,
    quest: <Scroll size={16} className="text-yellow-400 group-hover:text-yellow-300 transition-colors" />,
    misc: <Package size={16} className="text-gray-400 group-hover:text-gray-300 transition-colors" />,
};

const slotNames: Record<ItemSlot, string> = {
    mainHand: '주무기',
    offHand: '보조무기',
    armor: '갑옷',
    none: '',
};

const EquipmentSlot: React.FC<{
    slot: ItemSlot;
    itemId: string | null;
    inventory: Item[];
    onUnequip: (slot: ItemSlot) => void;
}> = ({ slot, itemId, inventory, onUnequip }) => {
    const item = inventory.find(i => i.id === itemId);

    const content = (
        <div className={`p-3 bg-gray-800/60 rounded-xl flex items-center gap-4 ${item ? 'border border-primary/30 shadow-[0_0_10px_rgba(212,175,55,0.1)]' : 'border border-white/5 opacity-70'}`}>
            <div className="w-10 h-10 flex-shrink-0 bg-gray-900/80 border border-gray-700/50 shadow-inner rounded-xl flex items-center justify-center text-cyan-400">
                {slotIcons[slot]}
            </div>
            <div className="flex-grow">
                <div className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">{slotNames[slot]}</div>
                {item ? (
                    <div className="font-bold text-gray-100 text-sm truncate">{item.name}</div>
                ) : (
                    <div className="text-gray-500 text-sm italic">- 비어 있음 -</div>
                )}
            </div>
            {item && (
                 <button
                    onClick={() => onUnequip(slot)}
                    className="w-8 h-8 flex-shrink-0 bg-gray-700 text-gray-300 border border-gray-600 rounded-lg flex items-center justify-center hover:bg-red-800 hover:text-white hover:border-red-600 transition-all shadow-sm"
                    aria-label={`${item.name} 장착 해제`}
                >
                    <Minus size={14}/>
                </button>
            )}
        </div>
    );

    return item ? (
        <ItemTooltip item={item} className="block relative">
            {content}
        </ItemTooltip>
    ) : content;
};


const Inventory: React.FC<InventoryProps> = ({ character, onEquipItem, onUnequipItem }) => {
    const equippedItemIds = new Set(Object.values(character.equipment));
    const bagItems = character.inventory.filter(item => !equippedItemIds.has(item.id));
    
    const renderEffect = (key: string, value: number) => {
        const sign = value > 0 ? '+' : '';
        const color = value > 0 ? 'text-green-400' : 'text-red-400';
        return <span key={key} className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-gray-900 border border-gray-700/50 ${color}`}>{key} {sign}{value}</span>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-bold text-cyan-300 mb-3 tracking-wider uppercase">현재 장비</h3>
                <div className="space-y-2">
                   <EquipmentSlot slot="mainHand" itemId={character.equipment.mainHand || null} inventory={character.inventory} onUnequip={onUnequipItem} />
                   <EquipmentSlot slot="offHand" itemId={character.equipment.offHand || null} inventory={character.inventory} onUnequip={onUnequipItem} />
                   <EquipmentSlot slot="armor" itemId={character.equipment.armor || null} inventory={character.inventory} onUnequip={onUnequipItem} />
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-cyan-300 mb-3 tracking-wider uppercase flex justify-between items-end">
                    가방 <span className="text-xs text-gray-500">{bagItems.length}개</span>
                </h3>
                {bagItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50 bg-gray-800/30 rounded-xl border border-dashed border-gray-600">
                        <Package className="w-12 h-12 mb-2 text-gray-500" />
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">가방이 비어 있습니다.</p>
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 gap-2">
                        {bagItems.map((item) => {
                            const isEquippable = item.slot !== 'none';
                            return (
                                <ItemTooltip key={item.id} item={item} className="block w-full">
                                    <li className="bg-gray-800/60 border border-white/5 hover:border-primary/20 hover:bg-gray-800 p-3 rounded-xl flex justify-between items-center group transition-all">
                                        <div className="flex gap-3 items-center flex-1 min-w-0">
                                            <div className="w-10 h-10 shrink-0 rounded-lg bg-gray-900/80 border border-gray-700 shadow-inner flex items-center justify-center">
                                                {itemTypeIcons[item.itemType] || <Package size={16} className="text-gray-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="font-bold text-sm text-gray-100 truncate">{item.name}</p>
                                                    {item.value > 0 && (
                                                        <span className="text-[10px] text-yellow-500 font-mono font-bold shrink-0">{item.value} G</span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed">{item.description}</p>
                                                {item.effects && Object.keys(item.effects).length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                        {Object.entries(item.effects).map(([key, value]) => renderEffect(key, value))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {isEquippable && (
                                            <button
                                                onClick={() => onEquipItem(item)}
                                                className="w-10 h-10 flex-shrink-0 bg-primary/10 text-primary border border-primary/30 rounded-lg flex items-center justify-center hover:bg-primary hover:text-bg-deep hover:border-primary transition-all shadow-sm ml-3"
                                                aria-label={`${item.name} 장착`}
                                            >
                                                <Plus size={18} />
                                            </button>
                                        )}
                                    </li>
                                </ItemTooltip>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Inventory;