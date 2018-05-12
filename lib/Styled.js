"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JSS = require("jss");
const React = require("react");
const StyledContext_1 = require("./StyledContext");
class Styled extends React.Component {
    render() {
        return React.createElement(StyledContext_1.default.Consumer, {
            children: (params) => {
                const id = params.id;
                const jss = JSS.create({});
                jss.use({
                    onProcessRule: ((rule) => {
                        rule.selectorText = ".s__s" + id + " " + rule.key;
                    }),
                });
                const styleSheet = jss.createStyleSheet(this.props.styles);
                return React.createElement("div", { className: "s__s" + id }, [
                    React.createElement("noindex", {
                        key: "style",
                        dangerouslySetInnerHTML: { __html: `<style type="text/css">${styleSheet.toString()}</style>` },
                    }),
                    this.props.children,
                ]);
            },
        });
    }
}
exports.default = Styled;
