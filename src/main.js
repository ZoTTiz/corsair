// http://reactivex.io/rxjs/
// https://facebook.github.io/immutable-js/

import Rx from 'rxjs/Rx';
import Immutable from 'immutable';
import clock from './clock';
import input from './input';
import renderer from './rendering';

const update = renderer();

function coinFactory() {
    const coins = [];
    for (let i = 0; i < 24; i++) {
        coins.push({
            angle: ((2 * Math.PI) / 24) * i,
            radius: 1,
            collision: false,
            collected: false,
        });
    }
    return coins;
}

const initialState = Immutable.fromJS({
    player: {
        position: Math.PI * 0.5,
        direction: -1,
    },
    speed: 1.25 / 1000,
    coins: coinFactory(),
});

const player = clock.withLatestFrom(input)
    .map(([clock, input]) => (state) => {
        const position = state.getIn(['player', 'position']) + clock.get('delta') * input.get('direction') * state.get('speed');
        const normalized = (position + 2 * Math.PI) % (2 * Math.PI);
        return state.merge({
            player: {
                position: normalized,
                direction: input.get('direction'),
            },
        });
    });

const updateCoins = state => state.update('coins', coins => coins.map((coin) => { // TODO
    if (coin.get('collision', false)) {
        return coin.set('collected', true);
    }
    const coinPosition = coin.get('angle');
    const coinRadius = ((2 * Math.PI) / 360) * coin.get('radius'); // TODO
    const playerPosition = state.getIn(['player', 'position']);
    const playerRadius = ((2 * Math.PI) / 360) * 6; // TODO
    if (Math.abs(playerPosition - coinPosition) <= coinRadius + playerRadius) {
        return coin.set('collision', true);
    }
    return coin;
}));

const state = Rx.Observable
    .merge(player)
    .scan((state, reducer) => updateCoins(reducer(state)), initialState);

const loop = clock.withLatestFrom(state, (clock, state) => state);
loop.subscribe(state => update(state));
