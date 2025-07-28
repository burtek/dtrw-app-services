#!/bin/bash
set -e

STATUS=$(node -e "
    require('http')
        .get(
            'http://localhost:4000/health',
            res => process.exit(res.statusCode === 200 ? 0 : 1)
        )
        .on('error', () => process.exit(1))
")
exit $?
