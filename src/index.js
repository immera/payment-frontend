
const Payment = function(settings, axios) {
    this._settings = settings;
    this._axios = axios;
    this._stripe = Stripe(settings.key)
    this.__proto__ = {
      _requestPayment: function(payment_method, options) {
        return this._axios.post('/payment/request', {
          "return_url": this._settings.callback,
          "payment_method": payment_method,
          ...options
        })
      },
      alipay: function(options) {
        this._requestPayment('alipay', options)
          .then(({data}) => {
            this._stripe.confirmAlipayPayment(
              data.response.client_secret, {
                return_url: data.callback
              }
            ).then(function(result) {
              if (result.error) {
                // Inform the customer that there was an error.
                console.error(error);
              }
            }).catch(console.error);
          })
      },
      wechat_pay: function(options) {
        this._requestPayment('wechat_pay', options)
          .then(({data}) => {
            this._stripe.confirmWechatPayPayment(
              data.response.client_secret,
              {
                payment_method_options: {
                  wechat_pay: { client: 'web' }
                }
              }
            ).then(({error, paymentIntent}) => {
              if (error) {
                // Inform the customer that there was an error.
                console.error(error);
              } else {
                console.log(data, paymentIntent)
                // this._axios.post(data.callback, paymentIntent)
                //   .then(console.log)
                //   .catch(console.error)
              }
            });
          })
      },
      initCard: function(cardId) {
        let element = this._stripe.elements();
        this.cardElem = element.create('card');
        this.cardElem.mount(cardId)
      },
      card: function(options) {
        this._requestPayment('card', options)
          .then(({data}) => {
            this._stripe.confirmCardPayment(
              data.response.client_secret, {
                payment_method: {card: this.cardElem}
              }
            ).then(function(result) {
              if (result.error) {
                // Inform the customer that there was an error.
                console.error(error);
              }
              console.log("Possibly successful payment")
              console.log(result)
            }).catch(console.error);
          })
      },
      multibanco: function(options) {
        let {amount, currency, name, email} = options;
        this._stripe.createSource({
          type: 'multibanco',
          amount, currency,
          owner: { name, email },
          redirect: {
            return_url: `{this._settings.api}/payment/webhook`,
          },
        }).then(console.log);
      },
      pay: function({payment_method, ...options}) {
        this[payment_method](options)
      }
    }
  }
  
  module.exports = Payment