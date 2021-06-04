const LightDom = (function () {


    return {
        parents: function (dom, selector) {
            while (dom.parentElement) {
                if (dom.parentElement.matches(selector)) {
                    return dom.parentElement
                } else {
                    dom = dom.parentElement
                }
            }
            return null
        },
        children: (dom, selector) => {
            for (let i = 0; i < dom.children.length; i++) {
                if (dom.children[i].matches(selector)) {
                    return dom.children[i]
                }
            }
        },
        findorappend: function (parent, selector, _child) {
            var child = LightDom.children(parent, selector);
            if (!child) {
                parent.appendChild(_child);
                child = LightDom.children(parent, selector);
            }
            return child;
        },
        findorprepend: function (parent, selector, _child) {
            var child = LightDom.children(parent, selector);
            if (!child) {
                parent.insertBefore(_child, parent.firstChild);
                child = LightDom.children(parent, selector);
            }
            return child;
        },
        addClass: (dom, className) => {
            if(!dom.classList.contains(className)){
                dom.classList.add(className)
            }
        }
    }
})()