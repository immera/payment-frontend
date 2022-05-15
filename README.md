# Payment frontend helper

This package is specifically to used with laravel backed package in order to handler frontend complecations using this package only and actual consumer of this package will only need to call method respectively with proper configurations.

## Configuration

## Dependancies

### stripe
make sure your stripe script `<script src="https://js.stripe.com/v3/"></script>` (ref: https://stripe.com/docs/js/including)

* Incase of nuxt - you can add it in the nuxt config like this

```js
export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    ...
    script: [
      { src: "https://js.stripe.com/v3/" }
    ]
  },
  ...
}
```

This dependancy we could not extract out from the application and keep the to scoped in the package level, so we have to keep it this way.

Honestly I'm not very happy with this type of dependacy but I don't get any better way.


### axios
for dependancy on axios we allow to pass the instance of axios while setting up payment object.
i.e.
```js
new Payment(settings, axios)
```

here the second parameter is axios dependancy, 

We implemented it this way to keep your existing settings as it is and you just need to pass the dependacy to use it for your server calls.