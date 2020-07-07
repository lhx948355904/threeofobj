var $document   = $(document);
        var selector    = '[data-rangeslider]';
        var $inputRange = $(selector);

        // Initialize the elements
        $inputRange.rangeslider({
            polyfill: false
        });
