import React from 'react';
import { Character, Item, ItemSlot, StatEffect, ItemType } from '../types';
import { Plus, Minus, HelpCircle, Hand, Shield, Shirt, Sword, FlaskConical, Scroll, Package } from 'lucide-react';

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
    weapon: <Sword size={14} className="text-red-400" />,
    armor: <Shield size={14} className="text-blue-400" />,
    consumable: <FlaskConical size={14} className="text-green-400" />,
    quest: <Scroll size={14} className="text-yellow-400" />,
    misc: <Package size={14} className="text-gray-400" />,
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

    return (
        <div className="p-2 bg-gray-700/50 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 flex-shrink-0 bg-gray-900/50 rounded-md flex items-center justify-center text-cyan-400 text-xl">
                {slotIcons[slot]}
            </div>
            <div className="flex-grow">
                <div className="text-xs text-gray-400">{slotNames[slot]}</div>
                {item ? (
                    <div className="font-bold text-gray-200 text-sm truncate">{item.name}</div>
                ) : (
                    <div className="text-gray-500 text-sm italic">- 비어 있음 -</div>
                )}
            </div>
            {item && (
                 <button
                    onClick={() => onUnequip(slot)}
                    className="w-7 h-7 flex-shrink-0 bg-red-800 text-white rounded-md flex items-center justify-center hover:bg-red-700 transition-colors"
                    aria-label={`${item.name} 장착 해제`}
                >
                    <Minus size={12}/>
                </button>
            )}
        </div>
    )
};


const Inventory: React.FC<InventoryProps> = ({ character, onEquipItem, onUnequipItem }) => {
    const equippedItemIds = new Set(Object.values(character.equipment));
    const bagItems = character.inventory.filter(item => !equippedItemIds.has(item.id));
    
    const renderEffect = (key: string, value: number) => {
        const sign = value > 0 ? '+' : '';
        const color = value > 0 ? 'text-green-400' : 'text-red-400';
        return <span key={key} className={`text-xs ${color}`}>{key} {sign}{value}</span>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-bold text-cyan-300 mb-2">장비</h3>
                <div className="space-y-2">
                   <EquipmentSlot slot="mainHand" itemId={character.equipment.mainHand || null} inventory={character.inventory} onUnequip={onUnequipItem} />
                   <EquipmentSlot slot="offHand" itemId={character.equipment.offHand || null} inventory={character.inventory} onUnequip={onUnequipItem} />
                   <EquipmentSlot slot="armor" itemId={character.equipment.armor || null} inventory={character.inventory} onUnequip={onUnequipItem} />
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-cyan-300 mb-2">가방</h3>
                {bagItems.length === 0 ? (
                    <p className="text-center text-gray-500 italic mt-4">가방이 비어 있습니다.</p>
                ) : (
                    <ul className="space-y-2">
                        {bagItems.map((item) => {
                            const isEquippable = item.slot !== 'none';
                            return (
                                <li key={item.id} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {itemTypeIcons[item.itemType] || <Package size={14} className="text-gray-400" />}
                                            <p className="font-bold text-gray-200">{item.name}</p>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                                        {item.effects && (
                                            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                                {Object.entries(item.effects).map(([key, value]) => renderEffect(key, value))}
                                            </div>
                                        )}
                                        {item.value > 0 && (
                                            <p className="text-xs text-yellow-400 mt-1 font-bold">{item.value} G</p>
                                        )}
                                    </div>
                                    {isEquippable && (
                                        <button
                                            onClick={() => onEquipItem(item)}
                                            className="w-8 h-8 flex-shrink-0 bg-green-700 text-white rounded-md flex items-center justify-center hover:bg-green-600 transition-colors ml-4"
                                            aria-label={`${item.name} 장착`}
                                        >
                                            <Plus />
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Inventory;