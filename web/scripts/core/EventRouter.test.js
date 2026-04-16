import {describe, test, expect, beforeEach, vi} from 'vitest';
import * as EventRouter from './EventRouter.js';

describe('EventRouter', () => {
    let handlers;
    let map;
    let radarRenderer;
    let clearHandlers;

    beforeEach(() => {
        EventRouter.reset();

        window.logger = {
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn()
        };

        handlers = {
            playersHandler: {
                updateLocalPlayerPosition: vi.fn(),
                removePlayer: vi.fn(),
                handleNewPlayerEvent: vi.fn(),
                handleMountedPlayerEvent: vi.fn(),
                UpdatePlayerHealth: vi.fn(),
                UpdatePlayerLooseHealth: vi.fn(),
                updateItems: vi.fn(),
                updatePlayerFaction: vi.fn()
            },
            mobsHandler: {
                updateMistPosition: vi.fn(),
                updateMobPosition: vi.fn(),
                removeMist: vi.fn(),
                removeMob: vi.fn(),
                updateEnchantEvent: vi.fn(),
                NewMobEvent: vi.fn(),
                debugLogMobById: vi.fn(),
                updateMobHealth: vi.fn(),
                updateMobHealthRegen: vi.fn(),
                updateMobHealthBulk: vi.fn()
            },
            harvestablesHandler: {
                newSimpleHarvestableObject: vi.fn(),
                newHarvestableObject: vi.fn(),
                HarvestUpdateEvent: vi.fn(),
                harvestFinished: vi.fn()
            },
            chestsHandler: {removeChest: vi.fn(), addChestEvent: vi.fn()},
            dungeonsHandler: {removeDungeon: vi.fn(), dungeonEvent: vi.fn()},
            fishingHandler: {removeFish: vi.fn(), newFishEvent: vi.fn(), fishingEnd: vi.fn()},
            wispCageHandler: {removeCage: vi.fn(), newCageEvent: vi.fn(), cageOpenedEvent: vi.fn()}
        };

        map = {id: -1, hX: 0, hY: 0, isBZ: false};
        radarRenderer = {
            setLocalPlayerPosition: vi.fn(),
            setMap: vi.fn()
        };
        clearHandlers = vi.fn();

        EventRouter.init({handlers, map, radarRenderer});
    });

    describe('onRequest opMove', () => {
        test('opcode 22 with float array updates local player position', () => {
            EventRouter.onRequest({253: 22, 1: [10.5, 20.5]});

            expect(handlers.playersHandler.updateLocalPlayerPosition).toHaveBeenCalledWith(10.5, 20.5);
            expect(radarRenderer.setLocalPlayerPosition).toHaveBeenCalledWith(10.5, 20.5);
            expect(EventRouter.getLocalPlayerPosition()).toEqual({x: 10.5, y: 20.5});
        });

        test('opcode 21 still works for backward compat', () => {
            EventRouter.onRequest({253: 21, 1: [1.5, 2.5]});

            expect(handlers.playersHandler.updateLocalPlayerPosition).toHaveBeenCalledWith(1.5, 2.5);
        });

        test('unrelated opcode is ignored', () => {
            EventRouter.onRequest({253: 999, 1: [1, 2]});

            expect(handlers.playersHandler.updateLocalPlayerPosition).not.toHaveBeenCalled();
            expect(radarRenderer.setLocalPlayerPosition).not.toHaveBeenCalled();
        });

        test('legacy Buffer payload is decoded via DataView', () => {
            const buffer = {
                type: 'Buffer',
                data: [0x00, 0x00, 0xc8, 0x41, 0x00, 0x00, 0x48, 0x42]
            };

            EventRouter.onRequest({253: 22, 1: buffer});

            expect(handlers.playersHandler.updateLocalPlayerPosition).toHaveBeenCalledWith(25.0, 50.0);
        });
    });

    describe('onResponse JoinMap', () => {
        test('opcode 2 with float array updates local player position and clears handlers', () => {
            EventRouter.onResponse({253: 2, 9: [100.5, 200.5], 103: 0}, clearHandlers);

            expect(handlers.playersHandler.updateLocalPlayerPosition).toHaveBeenCalledWith(100.5, 200.5);
            expect(clearHandlers).toHaveBeenCalledTimes(1);
        });

        test('opcode 2 extracts map id from params[8] and notifies renderer', () => {
            EventRouter.onResponse({253: 2, 8: '0203', 9: [0, 0]}, clearHandlers);

            expect(map.id).toBe('0203');
            expect(radarRenderer.setMap).toHaveBeenCalledWith(map);
        });

        test('opcode 2 leaves map id untouched when params[8] missing', () => {
            map.id = '0100';
            EventRouter.onResponse({253: 2, 9: [0, 0]}, clearHandlers);

            expect(map.id).toBe('0100');
        });
    });

    describe('onResponse ChangeCluster', () => {
        test('opcode 41 updates map id from params[0] and notifies renderer', () => {
            map.id = '0201';
            EventRouter.onResponse({253: 41, 0: '0203'}, clearHandlers);

            expect(map.id).toBe('0203');
            expect(radarRenderer.setMap).toHaveBeenCalledWith(map);
            expect(clearHandlers).toHaveBeenCalledTimes(1);
        });

        test('opcode 41 ignored when map id unchanged', () => {
            map.id = '0203';
            EventRouter.onResponse({253: 41, 0: '0203'}, clearHandlers);

            expect(radarRenderer.setMap).not.toHaveBeenCalled();
            expect(clearHandlers).not.toHaveBeenCalled();
        });

        test('opcode 41 ignored when params[0] not a valid zone string', () => {
            map.id = '0201';
            EventRouter.onResponse({253: 41, 0: null}, clearHandlers);

            expect(map.id).toBe('0201');
            expect(clearHandlers).not.toHaveBeenCalled();
        });
    });

    describe('onEvent Move', () => {
        test('Move event dispatches to mobsHandler with positions', () => {
            EventRouter.onEvent({0: 12345, 4: 100, 5: 200, 252: 3});

            expect(handlers.mobsHandler.updateMobPosition).toHaveBeenCalledWith(12345, 100, 200);
            expect(handlers.mobsHandler.updateMistPosition).toHaveBeenCalledWith(12345, 100, 200);
        });
    });
});
