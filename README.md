# Context-Style

Context-Style is a HTML custom element that allows developers to write context dependent style sheets with the utterly known CSS syntax. It builds upon the idea of media queries, where breakpoints are set to define different style rules. Media queries are mainly based on the viewport whereas Context-Style integrates some of the still in development Web APIs like DeviceLightEvent and DeviceMotionEvent to determine the context in which the users are.


#### Supported features:

`devicelight` and `devicemotion`


#### Usage

Import the minified file in the Head Tag

`<link rel="import" href="context.min.html">`

Web Components need a Polyfill depending on the browser, include the polyfill before ypu import the custom context element, see more on [https://github.com/webcomponents](https://github.com/webcomponents "Webcomponents")

`<script type="text/javascript" src="webcomponents-hi-sd-ce.js"></script>`

Write your styles using the @context rule on a separate css file and link them with the "href" attribute 

`<context-style href="your-context-styles.css"></context-style>`

or directly in the custom element, you can use "min-" and "max-" prefixes or range contexts, see more on [Evaluating Media Features](https://www.w3.org/TR/mediaqueries-4/#mq-range-context "Media Queries Level 4")

    <context-style>
        @context (30% <= devicelight <= 70%) {
            body { background-color: #eee}
            .class { background-color: #666; color: red }
        }
    </context-style>

