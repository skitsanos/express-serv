import Builder from './builder';

const builder = new Builder();
builder.app.locals = {
    title: 'mu app'
};

builder.app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})

builder.app.get('/_help', (req, res) =>
{
    console.log(Object.keys(req));
    res.send('ok');
});

builder.init();
